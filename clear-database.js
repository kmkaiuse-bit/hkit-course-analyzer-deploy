/**
 * Clear Mock Data from Learning Database
 * Removes all test/mock data from exemption_patterns and decision_history tables
 */

require('dotenv').config();
const dbConnection = require('./local/assets/js/db/connection');

async function clearDatabase() {
    try {
        console.log('🔧 Connecting to PostgreSQL database...');
        await dbConnection.connect();
        
        // Count current records before deletion
        console.log('📊 Counting current records...');
        const patternsCount = await dbConnection.query('SELECT COUNT(*) as count FROM exemption_patterns');
        const historyCount = await dbConnection.query('SELECT COUNT(*) as count FROM decision_history');
        
        console.log(`📋 Current data:`);
        console.log(`   - Exemption patterns: ${patternsCount.rows[0].count}`);
        console.log(`   - Decision history: ${historyCount.rows[0].count}`);
        
        if (patternsCount.rows[0].count === '0' && historyCount.rows[0].count === '0') {
            console.log('✅ Database is already empty - nothing to clear');
            return;
        }
        
        // Clear all data
        console.log('🗑️ Clearing all mock data...');
        
        // Delete in correct order (decision_history references exemption_patterns)
        await dbConnection.query('DELETE FROM decision_history');
        console.log('   ✅ Cleared decision_history table');
        
        await dbConnection.query('DELETE FROM exemption_patterns');
        console.log('   ✅ Cleared exemption_patterns table');
        
        // Reset auto-increment sequences
        await dbConnection.query('ALTER SEQUENCE exemption_patterns_id_seq RESTART WITH 1');
        await dbConnection.query('ALTER SEQUENCE decision_history_id_seq RESTART WITH 1');
        console.log('   ✅ Reset sequence counters');
        
        // Verify deletion
        const finalPatternsCount = await dbConnection.query('SELECT COUNT(*) as count FROM exemption_patterns');
        const finalHistoryCount = await dbConnection.query('SELECT COUNT(*) as count FROM decision_history');
        
        console.log('🎯 Final verification:');
        console.log(`   - Exemption patterns: ${finalPatternsCount.rows[0].count}`);
        console.log(`   - Decision history: ${finalHistoryCount.rows[0].count}`);
        
        if (finalPatternsCount.rows[0].count === '0' && finalHistoryCount.rows[0].count === '0') {
            console.log('✅ Database successfully cleared! Ready for real data.');
        } else {
            console.log('⚠️ Some records may still remain');
        }
        
    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
        process.exit(1);
    } finally {
        await dbConnection.disconnect();
        console.log('🔌 Database connection closed');
    }
}

// Run the cleanup
clearDatabase();