/**
 * SQLite Database Backup Script
 * Creates a timestamped backup of the database
 * Run: node scripts/backup-sqlite.js
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../exemption_data.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const KEEP_DAYS = 30; // Keep backups for 30 days

console.log('💾 SQLite Database Backup\n');

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found:', DB_PATH);
    process.exit(1);
}

// Create backup directory if not exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Created backup directory:', BACKUP_DIR);
}

// Create backup
const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const backupPath = path.join(BACKUP_DIR, `exemption_data_${timestamp}.db`);

try {
    // Check if backup for today already exists
    if (fs.existsSync(backupPath)) {
        console.log('⚠️  Backup for today already exists');
        console.log('   Overwriting:', backupPath);
    }

    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath);

    // Get file size
    const stats = fs.statSync(backupPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ Backup created successfully!');
    console.log('   Path:', backupPath);
    console.log('   Size:', sizeMB > 1 ? `${sizeMB} MB` : `${sizeKB} KB`);
    console.log('   Date:', new Date().toISOString());

    // Clean up old backups
    console.log('\n🧹 Cleaning up old backups...');
    cleanOldBackups(BACKUP_DIR, KEEP_DAYS);

} catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
}

/**
 * Clean up backups older than specified days
 */
function cleanOldBackups(backupDir, keepDays) {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const maxAge = keepDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach(file => {
        if (!file.startsWith('exemption_data_') || !file.endsWith('.db')) {
            return; // Skip non-backup files
        }

        const filePath = path.join(backupDir, file);
        const fileStats = fs.statSync(filePath);
        const age = now - fileStats.mtime.getTime();

        if (age > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`   🗑️  Deleted old backup: ${file} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
            deletedCount++;
        }
    });

    if (deletedCount === 0) {
        console.log('   No old backups to delete');
    } else {
        console.log(`   Deleted ${deletedCount} old backup(s)`);
    }

    // List remaining backups
    const remainingBackups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('exemption_data_') && f.endsWith('.db'))
        .sort()
        .reverse();

    console.log(`\n📋 Current backups (${remainingBackups.length}):`);
    remainingBackups.forEach(backup => {
        const backupPath = path.join(backupDir, backup);
        const stats = fs.statSync(backupPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        const date = backup.replace('exemption_data_', '').replace('.db', '');
        console.log(`   - ${date} (${sizeKB} KB)`);
    });
}
