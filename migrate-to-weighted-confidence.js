/**
 * Migration Script: Time-Weighted Confidence System
 * Upgrades existing database to support time-weighted confidence scoring with 0.99 daily retention
 */

const PatternRecorder = require('./local/assets/js/db/pattern-recorder');
const dbConnection = require('./local/assets/js/db/connection');
require('dotenv').config();

class WeightedConfidenceMigration {
    
    static async runMigration() {
        try {
            console.log('🔄 Starting Time-Weighted Confidence Migration...\n');
            
            // Step 1: Update database schema
            await this.updateSchema();
            
            // Step 2: Create synthetic decision history for existing patterns
            await this.createSyntheticHistory();
            
            // Step 3: Calculate weighted confidence for all patterns
            await this.calculateInitialWeightedConfidence();
            
            // Step 4: Verify migration
            await this.verifyMigration();
            
            console.log('\n✅ Migration completed successfully!');
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }
    
    /**
     * Step 1: Update database schema with new fields and tables
     */
    static async updateSchema() {
        console.log('1️⃣ Updating database schema...');
        
        try {
            // Add new columns to exemption_patterns if they don't exist (individual statements)
            try {
                await dbConnection.query(`
                    ALTER TABLE exemption_patterns 
                    ADD COLUMN weighted_confidence DECIMAL(5,4) DEFAULT 0.00
                `);
                console.log('  ✓ Added weighted_confidence column');
            } catch (e) {
                if (e.code === '42701') { // column already exists
                    console.log('  ✓ weighted_confidence column already exists');
                } else {
                    throw e;
                }
            }
            
            try {
                await dbConnection.query(`
                    ALTER TABLE exemption_patterns 
                    ADD COLUMN confidence_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                `);
                console.log('  ✓ Added confidence_updated_at column');
            } catch (e) {
                if (e.code === '42701') { // column already exists
                    console.log('  ✓ confidence_updated_at column already exists');
                } else {
                    throw e;
                }
            }
            
            // Add constraints for new columns
            try {
                await dbConnection.query(`
                    ALTER TABLE exemption_patterns 
                    ADD CONSTRAINT valid_weighted_confidence 
                    CHECK (weighted_confidence >= 0.0000 AND weighted_confidence <= 1.0000)
                `);
                console.log('  ✓ Added weighted_confidence constraint');
            } catch (e) {
                if (e.code === '42710') { // constraint already exists
                    console.log('  ✓ weighted_confidence constraint already exists');
                } else {
                    throw e;
                }
            }
            
            // Create decision_history table if it doesn't exist
            await dbConnection.query(`
                CREATE TABLE IF NOT EXISTS decision_history (
                    id SERIAL PRIMARY KEY,
                    pattern_id INTEGER NOT NULL REFERENCES exemption_patterns(id) ON DELETE CASCADE,
                    decision BOOLEAN NOT NULL,
                    decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    analysis_context JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create indexes for decision_history if they don't exist
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_decision_pattern_id ON decision_history(pattern_id)',
                'CREATE INDEX IF NOT EXISTS idx_decision_date ON decision_history(decision_date DESC)',
                'CREATE INDEX IF NOT EXISTS idx_decision ON decision_history(decision)',
                'CREATE INDEX IF NOT EXISTS idx_decision_analysis_context ON decision_history USING GIN(analysis_context)'
            ];
            
            for (const indexQuery of indexes) {
                await dbConnection.query(indexQuery);
            }
            
            // Create new indexes for exemption_patterns
            await dbConnection.query(`
                CREATE INDEX IF NOT EXISTS idx_weighted_confidence ON exemption_patterns(weighted_confidence DESC)
            `);
            await dbConnection.query(`
                CREATE INDEX IF NOT EXISTS idx_confidence_updated_at ON exemption_patterns(confidence_updated_at)
            `);
            
            console.log('  ✅ Database schema updated successfully');
            
        } catch (error) {
            console.error('  ❌ Schema update failed:', error);
            throw error;
        }
    }
    
    /**
     * Step 2: Create synthetic decision history for existing patterns
     */
    static async createSyntheticHistory() {
        console.log('2️⃣ Creating synthetic decision history for existing patterns...');
        
        try {
            // Get all existing patterns
            const patternsResult = await dbConnection.query(`
                SELECT id, hkit_subject, previous_subject, times_exempted, times_rejected, last_updated
                FROM exemption_patterns 
                WHERE times_exempted + times_rejected > 0
            `);
            
            console.log(`  📊 Found ${patternsResult.rows.length} patterns with decision history to migrate`);
            
            for (const pattern of patternsResult.rows) {
                await this.createSyntheticHistoryForPattern(pattern);
            }
            
            console.log('  ✅ Synthetic decision history created');
            
        } catch (error) {
            console.error('  ❌ Failed to create synthetic history:', error);
            throw error;
        }
    }
    
    /**
     * Create synthetic decision history for a single pattern
     */
    static async createSyntheticHistoryForPattern(pattern) {
        const totalDecisions = pattern.times_exempted + pattern.times_rejected;
        const exemptionRate = pattern.times_exempted / totalDecisions;
        
        // Spread decisions over the past 90 days (weighted toward recent)
        const baseDate = new Date(pattern.last_updated || new Date());
        const decisions = [];
        
        // Create decision distribution (more recent decisions weighted higher)
        for (let i = 0; i < totalDecisions; i++) {
            // Exponential distribution favoring recent dates
            const randomFactor = Math.random();
            const weightedRandom = Math.pow(randomFactor, 2); // Square makes it favor recent dates
            const daysAgo = Math.floor(weightedRandom * 90); // 0-90 days ago
            
            const decisionDate = new Date(baseDate);
            decisionDate.setDate(decisionDate.getDate() - daysAgo);
            
            // Determine if this decision was exempted based on pattern's rate
            const wasExempted = Math.random() < exemptionRate;
            
            decisions.push({
                decision: wasExempted,
                date: decisionDate
            });
        }
        
        // Sort by date (oldest first)
        decisions.sort((a, b) => a.date - b.date);
        
        // Insert decisions into history table
        for (const decision of decisions) {
            await dbConnection.query(`
                INSERT INTO decision_history (pattern_id, decision, decision_date, analysis_context)
                VALUES ($1, $2, $3, $4)
            `, [
                pattern.id,
                decision.decision,
                decision.date,
                JSON.stringify({ migration: true, synthetic: true })
            ]);
        }
        
        console.log(`    ✓ ${pattern.hkit_subject} ← ${pattern.previous_subject}: ${totalDecisions} synthetic decisions`);
    }
    
    /**
     * Step 3: Calculate weighted confidence for all patterns
     */
    static async calculateInitialWeightedConfidence() {
        console.log('3️⃣ Calculating time-weighted confidence for all patterns...');
        
        try {
            const updatedCount = await PatternRecorder.recalculateAllWeightedConfidence(0.99);
            console.log(`  ✅ Updated weighted confidence for ${updatedCount} patterns`);
            
        } catch (error) {
            console.error('  ❌ Failed to calculate weighted confidence:', error);
            throw error;
        }
    }
    
    /**
     * Step 4: Verify migration results
     */
    static async verifyMigration() {
        console.log('4️⃣ Verifying migration results...');
        
        try {
            // Check schema updates
            const schemaCheck = await dbConnection.query(`
                SELECT 
                    COUNT(*) as total_patterns,
                    COUNT(CASE WHEN weighted_confidence > 0 THEN 1 END) as patterns_with_weighted_confidence,
                    COUNT(CASE WHEN confidence_updated_at IS NOT NULL THEN 1 END) as patterns_with_update_time
                FROM exemption_patterns
            `);
            
            const stats = schemaCheck.rows[0];
            console.log(`  📊 Total patterns: ${stats.total_patterns}`);
            console.log(`  📊 Patterns with weighted confidence: ${stats.patterns_with_weighted_confidence}`);
            console.log(`  📊 Patterns with update timestamps: ${stats.patterns_with_update_time}`);
            
            // Check decision history
            const historyCheck = await dbConnection.query(`
                SELECT COUNT(*) as total_decisions
                FROM decision_history
            `);
            
            console.log(`  📊 Total decision history records: ${historyCheck.rows[0].total_decisions}`);
            
            // Sample weighted confidence comparison
            const comparisonSample = await dbConnection.query(`
                SELECT 
                    hkit_subject,
                    previous_subject,
                    confidence,
                    weighted_confidence,
                    CASE 
                        WHEN weighted_confidence > 0 THEN weighted_confidence 
                        ELSE confidence 
                    END as effective_confidence
                FROM exemption_patterns 
                ORDER BY effective_confidence DESC 
                LIMIT 5
            `);
            
            console.log('\n  🔍 Top 5 patterns by effective confidence:');
            for (const pattern of comparisonSample.rows) {
                const traditional = (pattern.confidence * 100).toFixed(1);
                const weighted = (pattern.weighted_confidence * 100).toFixed(2);
                const effective = (pattern.effective_confidence * 100).toFixed(2);
                
                console.log(`    ${pattern.hkit_subject} ← ${pattern.previous_subject}`);
                console.log(`      Traditional: ${traditional}% | Weighted: ${weighted}% | Effective: ${effective}%`);
            }
            
            console.log('  ✅ Migration verification completed');
            
        } catch (error) {
            console.error('  ❌ Migration verification failed:', error);
            throw error;
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    WeightedConfidenceMigration.runMigration()
        .then(() => {
            console.log('\n🎉 Time-weighted confidence system is now active!');
            console.log('📈 The system will now:');
            console.log('   • Use 0.99 daily retention (99% weight retained per day)');
            console.log('   • Prioritize recent exemption decisions');
            console.log('   • Adapt to curriculum changes over time');
            console.log('   • Provide more accurate AI suggestions');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration failed with error:', error);
            process.exit(1);
        });
}

module.exports = WeightedConfidenceMigration;