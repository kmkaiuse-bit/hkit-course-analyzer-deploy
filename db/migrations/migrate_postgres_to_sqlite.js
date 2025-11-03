/**
 * PostgreSQL to SQLite Migration Script
 * Migrates existing exemption_patterns and decision_history data to SQLite
 * Run: node db/migrations/migrate_postgres_to_sqlite.js
 */

const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuration
const SQLITE_DB_PATH = path.join(__dirname, '../../exemption_data.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

// PostgreSQL connection
const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'hkit_learning_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

// SQLite connection
let sqliteDb = null;

/**
 * Initialize SQLite database with schema
 */
async function initializeSQLite() {
    console.log('📦 Initializing SQLite database...');

    // Create backups directory if not exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('✅ SQLite database opened');
                resolve();
            }
        });
    });
}

/**
 * Create SQLite schema
 */
async function createSchema() {
    console.log('🏗️  Creating SQLite schema...');

    const schemaPath = path.join(__dirname, '001_create_sqlite_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    return new Promise((resolve, reject) => {
        sqliteDb.exec(schemaSql, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('✅ Schema created successfully');
                resolve();
            }
        });
    });
}

/**
 * Migrate exemption_patterns table
 */
async function migrateExemptionPatterns() {
    console.log('📊 Migrating exemption_patterns...');

    try {
        // Fetch all patterns from PostgreSQL
        const result = await pgPool.query(`
            SELECT
                id, hkit_subject, previous_subject, previous_normalized,
                times_seen, times_exempted, times_rejected,
                confidence, weighted_confidence, confidence_updated_at,
                programme_context, created_at, last_updated
            FROM exemption_patterns
            ORDER BY id
        `);

        console.log(`   Found ${result.rows.length} patterns to migrate`);

        if (result.rows.length === 0) {
            console.log('   No patterns to migrate');
            return 0;
        }

        // Clear existing sample data from SQLite
        await runSQLite('DELETE FROM exemption_patterns WHERE id <= 5');

        // Insert into SQLite
        const insertStmt = sqliteDb.prepare(`
            INSERT INTO exemption_patterns (
                hkit_subject, previous_subject, previous_normalized,
                times_seen, times_exempted, times_rejected,
                confidence, weighted_confidence, confidence_updated_at,
                programme_context, created_at, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let migratedCount = 0;
        for (const row of result.rows) {
            await new Promise((resolve, reject) => {
                insertStmt.run(
                    row.hkit_subject,
                    row.previous_subject,
                    row.previous_normalized,
                    row.times_seen,
                    row.times_exempted,
                    row.times_rejected,
                    row.confidence,
                    row.weighted_confidence || 0,
                    row.confidence_updated_at?.toISOString() || new Date().toISOString(),
                    row.programme_context,
                    row.created_at?.toISOString() || new Date().toISOString(),
                    row.last_updated?.toISOString() || new Date().toISOString(),
                    (err) => {
                        if (err) reject(err);
                        else {
                            migratedCount++;
                            resolve();
                        }
                    }
                );
            });
        }

        await new Promise((resolve, reject) => {
            insertStmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log(`✅ Migrated ${migratedCount} patterns`);
        return migratedCount;

    } catch (error) {
        console.error('❌ Error migrating patterns:', error);
        throw error;
    }
}

/**
 * Migrate decision_history table
 */
async function migrateDecisionHistory() {
    console.log('📜 Migrating decision_history...');

    try {
        // Fetch all decisions from PostgreSQL
        const result = await pgPool.query(`
            SELECT
                pattern_id, decision, decision_date,
                analysis_context, created_at
            FROM decision_history
            ORDER BY id
        `);

        console.log(`   Found ${result.rows.length} decisions to migrate`);

        if (result.rows.length === 0) {
            console.log('   No decisions to migrate');
            return 0;
        }

        // Create mapping of old pattern IDs to new SQLite pattern IDs
        const patternMapping = await getPatternMapping();

        // Insert into SQLite
        const insertStmt = sqliteDb.prepare(`
            INSERT INTO decision_history (
                pattern_id, decision, decision_date,
                analysis_context, created_at
            ) VALUES (?, ?, ?, ?, ?)
        `);

        let migratedCount = 0;
        for (const row of result.rows) {
            // Map old pattern_id to new SQLite pattern_id
            const newPatternId = patternMapping[row.pattern_id];
            if (!newPatternId) {
                console.warn(`   Warning: No mapping found for pattern_id ${row.pattern_id}, skipping`);
                continue;
            }

            await new Promise((resolve, reject) => {
                insertStmt.run(
                    newPatternId,
                    row.decision ? 1 : 0,
                    row.decision_date?.toISOString() || new Date().toISOString(),
                    JSON.stringify(row.analysis_context || {}),
                    row.created_at?.toISOString() || new Date().toISOString(),
                    (err) => {
                        if (err) reject(err);
                        else {
                            migratedCount++;
                            resolve();
                        }
                    }
                );
            });
        }

        await new Promise((resolve, reject) => {
            insertStmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log(`✅ Migrated ${migratedCount} decisions`);
        return migratedCount;

    } catch (error) {
        console.error('❌ Error migrating decisions:', error);
        throw error;
    }
}

/**
 * Get pattern ID mapping between PostgreSQL and SQLite
 */
async function getPatternMapping() {
    const pgPatterns = await pgPool.query(`
        SELECT id, hkit_subject, previous_normalized
        FROM exemption_patterns
        ORDER BY id
    `);

    const mapping = {};

    for (const pgRow of pgPatterns.rows) {
        const sqliteRow = await new Promise((resolve, reject) => {
            sqliteDb.get(
                'SELECT id FROM exemption_patterns WHERE hkit_subject = ? AND previous_normalized = ?',
                [pgRow.hkit_subject, pgRow.previous_normalized],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (sqliteRow) {
            mapping[pgRow.id] = sqliteRow.id;
        }
    }

    return mapping;
}

/**
 * Run SQLite query helper
 */
function runSQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

/**
 * Verify migration results
 */
async function verifyMigration() {
    console.log('\n🔍 Verifying migration...');

    // Count records in PostgreSQL
    const pgPatterns = await pgPool.query('SELECT COUNT(*) FROM exemption_patterns');
    const pgDecisions = await pgPool.query('SELECT COUNT(*) FROM decision_history');

    // Count records in SQLite
    const sqlitePatterns = await new Promise((resolve, reject) => {
        sqliteDb.get('SELECT COUNT(*) as count FROM exemption_patterns', (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    const sqliteDecisions = await new Promise((resolve, reject) => {
        sqliteDb.get('SELECT COUNT(*) as count FROM decision_history', (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    console.log('\n📊 Migration Summary:');
    console.log('┌─────────────────────────┬────────────┬────────────┐');
    console.log('│ Table                   │ PostgreSQL │ SQLite     │');
    console.log('├─────────────────────────┼────────────┼────────────┤');
    console.log(`│ exemption_patterns      │ ${String(pgPatterns.rows[0].count).padEnd(10)} │ ${String(sqlitePatterns).padEnd(10)} │`);
    console.log(`│ decision_history        │ ${String(pgDecisions.rows[0].count).padEnd(10)} │ ${String(sqliteDecisions).padEnd(10)} │`);
    console.log('└─────────────────────────┴────────────┴────────────┘');

    const patternsMatch = parseInt(pgPatterns.rows[0].count) === sqlitePatterns;
    const decisionsMatch = parseInt(pgDecisions.rows[0].count) === sqliteDecisions;

    if (patternsMatch && decisionsMatch) {
        console.log('\n✅ Migration verified successfully!');
        return true;
    } else {
        console.log('\n⚠️  Warning: Record counts do not match!');
        return false;
    }
}

/**
 * Create backup of SQLite database
 */
function createBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = path.join(BACKUP_DIR, `exemption_data_${timestamp}.db`);

    if (fs.existsSync(SQLITE_DB_PATH)) {
        fs.copyFileSync(SQLITE_DB_PATH, backupPath);
        console.log(`💾 Backup created: ${backupPath}`);
    }
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('🚀 Starting PostgreSQL to SQLite migration...\n');

    try {
        // Step 1: Initialize SQLite
        await initializeSQLite();

        // Step 2: Create schema
        await createSchema();

        // Step 3: Migrate exemption patterns
        const patternsCount = await migrateExemptionPatterns();

        // Step 4: Migrate decision history
        const decisionsCount = await migrateDecisionHistory();

        // Step 5: Verify migration
        const verified = await verifyMigration();

        // Step 6: Create backup
        if (verified) {
            createBackup();
        }

        console.log('\n✅ Migration completed successfully!');
        console.log(`   Migrated ${patternsCount} patterns and ${decisionsCount} decisions`);
        console.log(`   Database location: ${SQLITE_DB_PATH}`);
        console.log('\n📋 Next steps:');
        console.log('   1. Test the SQLite database with your application');
        console.log('   2. Update your code to use SQLite instead of PostgreSQL');
        console.log('   3. If everything works, you can decommission PostgreSQL');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Close connections
        await pgPool.end();
        if (sqliteDb) {
            sqliteDb.close();
        }
    }
}

// Run migration
migrate();
