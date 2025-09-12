/**
 * Test script to verify PostgreSQL connection and learning database
 */

const dbConnection = require('./local/assets/js/db/connection');

async function testConnection() {
    console.log('🔄 Testing PostgreSQL connection...');
    
    try {
        // Test basic connection
        await dbConnection.connect();
        
        // Health check
        const health = await dbConnection.healthCheck();
        console.log('📊 Health Check:', health);
        
        // Get database statistics
        const stats = await dbConnection.getStats();
        console.log('📈 Database Stats:', stats);
        
        // Test sample query
        const samplePatterns = await dbConnection.query(
            'SELECT * FROM pattern_analysis LIMIT 3'
        );
        console.log('📝 Sample Patterns:');
        samplePatterns.rows.forEach(row => {
            console.log(`  ${row.hkit_subject} ← ${row.previous_subject} (${row.confidence} confidence)`);
        });
        
        console.log('✅ All database tests passed!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    } finally {
        await dbConnection.disconnect();
    }
}

// Run the test
testConnection();