/**
 * SQLite Database Connection Module
 * Handles connection and basic database operations for learning system
 * Replacement for PostgreSQL connection.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseConnection {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.dbPath = path.join(__dirname, '../../../../exemption_data.db');
    }

    /**
     * Initialize database connection
     */
    async connect() {
        if (this.db) {
            return this.db;
        }

        try {
            console.log('Connecting to SQLite database:', this.dbPath);

            this.db = await new Promise((resolve, reject) => {
                const database = new sqlite3.Database(
                    this.dbPath,
                    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
                    (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(database);
                        }
                    }
                );
            });

            // Enable foreign keys
            await this.run('PRAGMA foreign_keys = ON');

            // Test connection
            await this.query('SELECT 1');

            this.isConnected = true;
            console.log('✅ SQLite connected successfully');
            return this.db;

        } catch (error) {
            console.error('❌ SQLite connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Execute a query with parameters (SELECT queries)
     * Returns: { rows: [...] } to match PostgreSQL API
     */
    async query(sql, params = []) {
        if (!this.db) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                } else {
                    // Return in PostgreSQL format for compatibility
                    resolve({ rows: rows || [] });
                }
            });
        });
    }

    /**
     * Execute a single row query
     */
    async queryOne(sql, params = []) {
        if (!this.db) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Execute a non-SELECT query (INSERT, UPDATE, DELETE)
     * Returns: { lastID, changes }
     */
    async run(sql, params = []) {
        if (!this.db) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database run error:', err);
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes,
                        // Compatibility with PostgreSQL API
                        insertId: this.lastID
                    });
                }
            });
        });
    }

    /**
     * Execute multiple statements (for migrations/setup)
     */
    async exec(sql) {
        if (!this.db) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) {
                    console.error('Database exec error:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Begin transaction
     */
    async beginTransaction() {
        await this.run('BEGIN TRANSACTION');
    }

    /**
     * Commit transaction
     */
    async commit() {
        await this.run('COMMIT');
    }

    /**
     * Rollback transaction
     */
    async rollback() {
        await this.run('ROLLBACK');
    }

    /**
     * Execute transaction with auto-commit/rollback
     */
    async transaction(callback) {
        try {
            await this.beginTransaction();
            const result = await callback(this);
            await this.commit();
            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    /**
     * Close database connection
     */
    async disconnect() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db = null;
                        this.isConnected = false;
                        console.log('SQLite disconnected');
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * Check if database is connected and healthy
     */
    async healthCheck() {
        try {
            if (!this.db) {
                return { status: 'disconnected', error: 'No connection' };
            }

            const result = await this.query('SELECT COUNT(*) as count FROM exemption_patterns');
            return {
                status: 'connected',
                patternsCount: result.rows[0]?.count || 0,
                timestamp: new Date().toISOString(),
                dbPath: this.dbPath
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
                    ROUND(AVG(confidence), 3) as avg_confidence,
                    ROUND(AVG(CASE WHEN weighted_confidence > 0 THEN weighted_confidence END), 3) as avg_weighted_confidence,
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

    /**
     * Initialize database schema if not exists
     */
    async initializeSchema() {
        try {
            const schemaPath = path.join(__dirname, '../../../../db/migrations/001_create_sqlite_schema.sql');

            if (!fs.existsSync(schemaPath)) {
                console.warn('Schema file not found, database may need manual initialization');
                return false;
            }

            const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
            await this.exec(schemaSql);

            console.log('✅ Database schema initialized');
            return true;

        } catch (error) {
            console.error('Error initializing schema:', error);
            throw error;
        }
    }

    /**
     * Get database file size
     */
    getDatabaseSize() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const stats = fs.statSync(this.dbPath);
                const sizeInBytes = stats.size;
                const sizeInKB = (sizeInBytes / 1024).toFixed(2);
                const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

                return {
                    bytes: sizeInBytes,
                    kb: sizeInKB,
                    mb: sizeInMB,
                    formatted: sizeInMB > 1 ? `${sizeInMB} MB` : `${sizeInKB} KB`
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting database size:', error);
            return null;
        }
    }

    /**
     * Vacuum database (compact and optimize)
     */
    async vacuum() {
        console.log('🧹 Running VACUUM to optimize database...');
        await this.run('VACUUM');
        console.log('✅ Database optimized');
    }

    /**
     * Backup database to specified path
     */
    async backup(backupPath) {
        if (!backupPath) {
            const timestamp = new Date().toISOString().split('T')[0];
            backupPath = path.join(
                path.dirname(this.dbPath),
                'backups',
                `exemption_data_${timestamp}.db`
            );
        }

        // Create backup directory if not exists
        const backupDir = path.dirname(backupPath);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Copy database file
        fs.copyFileSync(this.dbPath, backupPath);
        console.log(`💾 Backup created: ${backupPath}`);

        return backupPath;
    }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
