/**
 * Simple script to view database contents
 * Run: node view-database-data.js
 */

const dbConnection = require('./local/assets/js/db/connection');

async function viewDatabaseData() {
    try {
        console.log('🔍 HKIT Learning Database Viewer');
        console.log('='.repeat(50));
        
        await dbConnection.connect();
        
        // Get all patterns
        const patterns = await dbConnection.query(`
            SELECT 
                id,
                hkit_subject,
                previous_subject,
                times_seen,
                times_exempted,
                times_rejected,
                confidence,
                programme_context,
                created_at::date as created,
                last_updated::date as updated
            FROM exemption_patterns 
            ORDER BY confidence DESC, last_updated DESC
        `);
        
        console.log(`\n📊 EXEMPTION PATTERNS (${patterns.rows.length} total)\n`);
        
        // Display in table format
        console.table(patterns.rows);
        
        // Summary statistics
        const stats = await dbConnection.query(`
            SELECT 
                COUNT(*) as total_patterns,
                AVG(confidence)::decimal(5,2) as avg_confidence,
                SUM(times_seen) as total_observations,
                SUM(times_exempted) as total_exemptions,
                COUNT(DISTINCT hkit_subject) as unique_hkit_subjects,
                COUNT(DISTINCT programme_context) as unique_programmes
            FROM exemption_patterns
        `);
        
        console.log('\n📈 SUMMARY STATISTICS');
        console.log('='.repeat(30));
        const summary = stats.rows[0];
        console.log(`Total Patterns: ${summary.total_patterns}`);
        console.log(`Average Confidence: ${summary.avg_confidence}%`);
        console.log(`Total Observations: ${summary.total_observations}`);
        console.log(`Total Exemptions: ${summary.total_exemptions}`);
        console.log(`Unique HKIT Subjects: ${summary.unique_hkit_subjects}`);
        console.log(`Unique Programmes: ${summary.unique_programmes}`);
        
        // Programme breakdown
        const programmes = await dbConnection.query(`
            SELECT 
                programme_context as programme,
                COUNT(*) as patterns,
                AVG(confidence)::decimal(5,2) as avg_confidence
            FROM exemption_patterns 
            GROUP BY programme_context 
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('\n🎓 BY PROGRAMME');
        console.log('='.repeat(20));
        console.table(programmes.rows);
        
        // Recent activity
        const recent = await dbConnection.query(`
            SELECT 
                hkit_subject,
                previous_subject,
                confidence,
                programme_context,
                last_updated::date
            FROM exemption_patterns 
            ORDER BY last_updated DESC 
            LIMIT 10
        `);
        
        console.log('\n🕐 RECENT ACTIVITY (Last 10)');
        console.log('='.repeat(35));
        console.table(recent.rows);
        
        console.log('\n✅ Database view complete!');
        console.log('\n💡 To share with colleagues:');
        console.log('1. Screenshot this output');
        console.log('2. Use pgAdmin for visual interface');
        console.log('3. Export data: node export-database.js');
        
    } catch (error) {
        console.error('❌ Error viewing database:', error.message);
    } finally {
        await dbConnection.disconnect();
    }
}

viewDatabaseData();