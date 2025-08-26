/**
 * Results Display - Simple Local Version
 */

const ResultsDisplay = {
    currentResults: null,

    showResults(results, programmeId) {
        this.currentResults = results;
        
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) return;

        resultsSection.style.display = 'block';
        
        // Show summary stats
        this.showSummaryStats(results);
        
        // Show table view
        this.showTableView(results);
        
        // Show export buttons
        this.showExportButtons();
    },

    showSummaryStats(results) {
        const summaryStats = document.getElementById('summaryStats');
        if (!summaryStats) return;

        const exempted = results.filter(r => r['Exemption Granted'] === 'TRUE').length;
        const total = results.length;
        const percentage = Math.round((exempted / total) * 100);

        summaryStats.innerHTML = `
            <div class="summary-card">
                <h4>📊 Analysis Summary</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${exempted}</span>
                        <span class="stat-label">Exempted Courses</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${total - exempted}</span>
                        <span class="stat-label">Courses to Study</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${percentage}%</span>
                        <span class="stat-label">Exemption Rate</span>
                    </div>
                </div>
            </div>
        `;
    },

    showTableView(results) {
        const tableView = document.getElementById('tableView');
        if (!tableView) return;

        tableView.innerHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Status</th>
                        <th>Previous Course</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(result => `
                        <tr class="${result['Exemption Granted'] === 'TRUE' ? 'exempted' : 'not-exempted'}">
                            <td><strong>${result['HKIT Subject Code']}</strong></td>
                            <td>${result['HKIT Subject Name']}</td>
                            <td>
                                ${result['Exemption Granted'] === 'TRUE' 
                                    ? '<span class="status-exempted">✅ Exempted</span>' 
                                    : '<span class="status-required">📚 Required</span>'
                                }
                            </td>
                            <td>${result['Subject Name of Previous Studies'] || '-'}</td>
                            <td>${result['Remarks'] || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    showExportButtons() {
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
        }
    },

    clearResults() {
        this.currentResults = null;
        
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }

        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.style.display = 'none';
        }
    }
};

// Export functions for HTML onclick handlers
window.exportCSV = function() {
    if (!ResultsDisplay.currentResults) {
        Utils.showError('No results to export');
        return;
    }

    const headers = [
        'HKIT Subject Code',
        'HKIT Subject Name',
        'Exemption Granted / study plan',
        'Subject Name of Previous Studies',
        'Exemption Granted',
        'Remarks'
    ];

    let csv = headers.join(',') + '\n';
    
    ResultsDisplay.currentResults.forEach(result => {
        const row = headers.map(header => {
            const value = result[header] || '';
            return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csv += row.join(',') + '\n';
    });

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    Utils.downloadFile(csv, `hkit_analysis_${timestamp}.csv`, 'text/csv');
};

window.exportJSON = function() {
    if (!ResultsDisplay.currentResults) {
        Utils.showError('No results to export');
        return;
    }

    const json = JSON.stringify(ResultsDisplay.currentResults, null, 2);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    Utils.downloadFile(json, `hkit_analysis_${timestamp}.json`, 'application/json');
};

window.ResultsDisplay = ResultsDisplay;
