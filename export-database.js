/**
 * Export database data to CSV for sharing
 * Run: node export-database.js
 */

const dbConnection = require('./local/assets/js/db/connection');
const fs = require('fs');

async function exportDatabaseData() {
    try {
        console.log('📦 Exporting HKIT Learning Database...');
        
        await dbConnection.connect();
        
        // Get all patterns with formatted data
        const patterns = await dbConnection.query(`
            SELECT 
                id,
                hkit_subject as "HKIT Subject",
                previous_subject as "Previous Subject",
                times_seen as "Times Seen",
                times_exempted as "Times Exempted", 
                times_rejected as "Times Rejected",
                ROUND(confidence * 100) as "Confidence %",
                programme_context as "Programme",
                created_at::date as "Created Date",
                last_updated::date as "Last Updated"
            FROM exemption_patterns 
            ORDER BY confidence DESC, last_updated DESC
        `);
        
        if (patterns.rows.length === 0) {
            console.log('❌ No data to export');
            return;
        }
        
        // Convert to CSV
        const headers = Object.keys(patterns.rows[0]);
        const csvContent = [
            headers.join(','), // Header row
            ...patterns.rows.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(',')
            )
        ].join('\n');
        
        // Save to file
        const filename = `hkit_learning_patterns_${new Date().toISOString().split('T')[0]}.csv`;
        fs.writeFileSync(filename, csvContent);
        
        console.log(`✅ Export complete: ${filename}`);
        console.log(`📊 Exported ${patterns.rows.length} patterns`);
        
        // Also create a summary report
        const stats = await dbConnection.query(`
            SELECT 
                COUNT(*) as total_patterns,
                AVG(confidence)::decimal(5,2) as avg_confidence,
                SUM(times_seen) as total_observations,
                SUM(times_exempted) as total_exemptions,
                COUNT(DISTINCT hkit_subject) as unique_hkit_subjects,
                COUNT(DISTINCT programme_context) as unique_programmes,
                MIN(created_at)::date as oldest_pattern,
                MAX(last_updated)::date as newest_pattern
            FROM exemption_patterns
        `);
        
        const summary = stats.rows[0];
        const reportContent = `HKIT Learning Database Report
Generated: ${new Date().toLocaleString()}

SUMMARY STATISTICS:
- Total Patterns: ${summary.total_patterns}
- Average Confidence: ${summary.avg_confidence}%
- Total Observations: ${summary.total_observations}
- Total Exemptions: ${summary.total_exemptions}
- Unique HKIT Subjects: ${summary.unique_hkit_subjects}
- Unique Programmes: ${summary.unique_programmes}
- Date Range: ${summary.oldest_pattern} to ${summary.newest_pattern}

EXEMPTION RATE: ${Math.round((summary.total_exemptions / summary.total_observations) * 100)}%

FILES GENERATED:
- ${filename} (Full pattern data in CSV format)
- hkit_learning_report_${new Date().toISOString().split('T')[0]}.txt (This report)

SHARING INSTRUCTIONS:
1. Open ${filename} in Excel or Google Sheets
2. Share this report with colleagues
3. Use pgAdmin for interactive database viewing
`;
        
        const reportFilename = `hkit_learning_report_${new Date().toISOString().split('T')[0]}.txt`;
        fs.writeFileSync(reportFilename, reportContent);
        
        console.log(`📄 Report created: ${reportFilename}`);
        console.log('\n🎯 Ready to share with colleagues!');
        
    } catch (error) {
        console.error('❌ Export failed:', error.message);
    } finally {
        await dbConnection.disconnect();
    }
}

exportDatabaseData();