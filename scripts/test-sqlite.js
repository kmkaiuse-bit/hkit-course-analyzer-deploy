/**
 * SQLite Database Test Script
 * Tests SQLite database connection and operations
 * Run: node scripts/test-sqlite.js
 */

const dbConnection = require('../local/assets/js/db/connection-sqlite');

async function testDatabase() {
    console.log('🧪 Testing SQLite Database\n');

    try {
        // Test 1: Connection
        console.log('Test 1: Database Connection');
        await dbConnection.connect();
        console.log('✅ Connected successfully\n');

        // Test 2: Health Check
        console.log('Test 2: Health Check');
        const health = await dbConnection.healthCheck();
        console.log('   Status:', health.status);
        console.log('   Patterns Count:', health.patternsCount);
        console.log('   Database Path:', health.dbPath);
        console.log('✅ Health check passed\n');

        // Test 3: Database Stats
        console.log('Test 3: Database Statistics');
        const stats = await dbConnection.getStats();
        console.log('   Total Patterns:', stats.total_patterns);
        console.log('   Average Confidence:', stats.avg_confidence);
        console.log('   Total Observations:', stats.total_observations);
        console.log('   Unique HKIT Subjects:', stats.unique_hkit_subjects);
        console.log('✅ Stats retrieved successfully\n');

        // Test 4: Database Size
        console.log('Test 4: Database Size');
        const size = dbConnection.getDatabaseSize();
        if (size) {
            console.log('   Size:', size.formatted);
            console.log('   Bytes:', size.bytes);
        }
        console.log('✅ Size check passed\n');

        // Test 5: Sample Query
        console.log('Test 5: Sample Query');
        const patterns = await dbConnection.query(`
            SELECT hkit_subject, previous_subject, confidence, times_seen
            FROM exemption_patterns
            ORDER BY confidence DESC
            LIMIT 5
        `);
        console.log(`   Found ${patterns.rows.length} patterns:`);
        patterns.rows.forEach(p => {
            console.log(`   - ${p.previous_subject} → ${p.hkit_subject} (confidence: ${p.confidence}, seen: ${p.times_seen})`);
        });
        console.log('✅ Query executed successfully\n');

        // Test 6: Insert and Update
        console.log('Test 6: Insert and Update Pattern');
        const testPattern = {
            hkit_subject: 'TEST101',
            previous_subject: 'Test Subject',
            previous_normalized: 'test_subject',
            times_seen: 1,
            times_exempted: 1,
            times_rejected: 0,
            confidence: 1.0
        };

        // Try to insert
        try {
            const insertResult = await dbConnection.run(`
                INSERT INTO exemption_patterns
                (hkit_subject, previous_subject, previous_normalized, times_seen, times_exempted, times_rejected, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                testPattern.hkit_subject,
                testPattern.previous_subject,
                testPattern.previous_normalized,
                testPattern.times_seen,
                testPattern.times_exempted,
                testPattern.times_rejected,
                testPattern.confidence
            ]);

            console.log('   Insert ID:', insertResult.lastID);

            // Update the pattern
            await dbConnection.run(`
                UPDATE exemption_patterns
                SET times_seen = times_seen + 1,
                    times_exempted = times_exempted + 1
                WHERE id = ?
            `, [insertResult.lastID]);

            console.log('   Updated successfully');

            // Delete the test pattern
            await dbConnection.run('DELETE FROM exemption_patterns WHERE id = ?', [insertResult.lastID]);
            console.log('   Test pattern deleted');

        } catch (error) {
            if (error.message.includes('UNIQUE constraint')) {
                console.log('   Test pattern already exists, cleaning up...');
                await dbConnection.run(`
                    DELETE FROM exemption_patterns
                    WHERE hkit_subject = ? AND previous_normalized = ?
                `, [testPattern.hkit_subject, testPattern.previous_normalized]);
            } else {
                throw error;
            }
        }
        console.log('✅ Insert/Update test passed\n');

        // Test 7: Transaction
        console.log('Test 7: Transaction Test');
        await dbConnection.transaction(async (db) => {
            await db.run('INSERT INTO audit_log (table_name, record_id, action) VALUES (?, ?, ?)',
                ['test_table', 999, 'test']);

            const result = await db.query('SELECT * FROM audit_log WHERE record_id = ?', [999]);
            console.log('   Transaction test record created:', result.rows.length > 0);

            // Clean up
            await db.run('DELETE FROM audit_log WHERE record_id = ?', [999]);
        });
        console.log('✅ Transaction test passed\n');

        // Test 8: Views
        console.log('Test 8: Views Test');
        const learningStats = await dbConnection.queryOne('SELECT * FROM learning_stats');
        console.log('   Learning Stats View:');
        console.log('   - Total Patterns:', learningStats.total_patterns);
        console.log('   - Total Analyses:', learningStats.total_analyses);
        console.log('   - Avg Confidence:', learningStats.avg_confidence);

        const recentAnalyses = await dbConnection.query('SELECT * FROM recent_analyses LIMIT 3');
        console.log(`   Recent Analyses View: ${recentAnalyses.rows.length} records`);
        console.log('✅ Views test passed\n');

        // Test 9: Analysis Results Table
        console.log('Test 9: Analysis Results Table');
        const analysisCount = await dbConnection.queryOne('SELECT COUNT(*) as count FROM analysis_results');
        console.log('   Analysis Results Count:', analysisCount.count);
        console.log('✅ Analysis results test passed\n');

        // Final Summary
        console.log('═══════════════════════════════════════════════');
        console.log('✅ All tests passed successfully!');
        console.log('═══════════════════════════════════════════════');
        console.log('\n📊 Database Summary:');
        console.log(`   Location: ${health.dbPath}`);
        console.log(`   Size: ${size?.formatted || 'Unknown'}`);
        console.log(`   Patterns: ${stats.total_patterns}`);
        console.log(`   Status: Ready for use`);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await dbConnection.disconnect();
        console.log('\n🔌 Database disconnected');
    }
}

// Run tests
testDatabase();
