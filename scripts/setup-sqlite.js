/**
 * SQLite Database Setup Script
 * Initializes a fresh SQLite database with schema
 * Run: node scripts/setup-sqlite.js
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../exemption_data.db');
const SCHEMA_PATH = path.join(__dirname, '../db/migrations/001_create_sqlite_schema.sql');
const BACKUP_DIR = path.join(__dirname, '../backups');

console.log('🚀 SQLite Database Setup\n');

// Check if database already exists
if (fs.existsSync(DB_PATH)) {
    console.log('⚠️  Database already exists at:', DB_PATH);
    console.log('   Creating backup before proceeding...\n');

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Backup existing database
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `exemption_data_backup_${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✅ Backup created: ${backupPath}\n`);
}

// Read schema file
if (!fs.existsSync(SCHEMA_PATH)) {
    console.error('❌ Schema file not found:', SCHEMA_PATH);
    process.exit(1);
}

const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

// Create/open database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Failed to open database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database opened:', DB_PATH);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
        console.error('❌ Failed to enable foreign keys:', err.message);
        db.close();
        process.exit(1);
    }
});

// Execute schema
console.log('\n📦 Creating database schema...');
db.exec(schemaSql, (err) => {
    if (err) {
        console.error('❌ Failed to create schema:', err.message);
        db.close();
        process.exit(1);
    }

    console.log('✅ Schema created successfully');

    // Verify tables created
    db.all(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        [],
        (err, tables) => {
            if (err) {
                console.error('❌ Error verifying tables:', err.message);
                db.close();
                process.exit(1);
            }

            console.log('\n📊 Tables created:');
            tables.forEach(table => {
                console.log(`   - ${table.name}`);
            });

            // Get database stats
            db.get('SELECT * FROM learning_stats', [], (err, stats) => {
                if (err) {
                    console.error('❌ Error getting stats:', err.message);
                } else if (stats) {
                    console.log('\n📈 Database Statistics:');
                    console.log(`   Patterns: ${stats.total_patterns || 0}`);
                    console.log(`   Analyses: ${stats.total_analyses || 0}`);
                    console.log(`   High Confidence Patterns: ${stats.high_confidence_patterns || 0}`);
                }

                // Get database size
                const dbStats = fs.statSync(DB_PATH);
                const sizeKB = (dbStats.size / 1024).toFixed(2);
                const sizeMB = (dbStats.size / (1024 * 1024)).toFixed(2);

                console.log('\n💾 Database Size:');
                console.log(`   ${sizeMB} MB (${sizeKB} KB)`);

                console.log('\n✅ Setup completed successfully!');
                console.log('\n📋 Next steps:');
                console.log('   1. Update your application to use SQLite connection');
                console.log('   2. Test the database with: node scripts/test-sqlite.js');
                console.log('   3. Start using the application!');

                // Close database
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                        process.exit(1);
                    }
                });
            });
        }
    );
});
