/**
 * PostgreSQL Database Connection Module
 * Handles connection pooling and basic database operations for learning system
 */

const { Pool } = require('pg');
require('dotenv').config();

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection pool
     */
    async connect() {
        if (this.pool) {
            return this.pool;
        }

        try {
            // Debug connection parameters (remove password from logs)
            const config = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || 'hkit_learning_db',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD,
                max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
                idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
                connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
            };

            console.log('Connection config:', {
                ...config,
                password: config.password ? '[SET]' : '[NOT SET]'
            });

            this.pool = new Pool(config);

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            console.log('✅ PostgreSQL connected successfully');
            return this.pool;

        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Execute a query with parameters
     */
    async query(text, params = []) {
        if (!this.pool) {
            await this.connect();
        }

        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    /**
     * Get a client from the pool (for transactions)
     */
    async getClient() {
        if (!this.pool) {
            await this.connect();
        }
        return await this.pool.connect();
    }

    /**
     * Close all connections
     */
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.isConnected = false;
            console.log('PostgreSQL disconnected');
        }
    }

    /**
     * Check if database is connected
     */
    async healthCheck() {
        try {
            if (!this.pool) {
                return { status: 'disconnected', error: 'No connection pool' };
            }

            const result = await this.query('SELECT COUNT(*) as count FROM exemption_patterns');
            return {
                status: 'connected',
                patternsCount: parseInt(result.rows[0].count),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        try {
            const result = await this.query(`
                SELECT 
                    COUNT(*) as total_patterns,
                    AVG(confidence) as avg_confidence,
                    SUM(times_seen) as total_observations,
                    SUM(times_exempted) as total_exemptions,
                    COUNT(DISTINCT hkit_subject) as unique_hkit_subjects,
                    COUNT(DISTINCT programme_context) as unique_programmes
                FROM exemption_patterns
            `);

            return result.rows[0];
        } catch (error) {
            console.error('Error getting database stats:', error);
            throw error;
        }
    }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;