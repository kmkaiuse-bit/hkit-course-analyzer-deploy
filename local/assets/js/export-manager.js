/**
 * Export Manager - Enhanced with Error Handling
 * Handles exporting results in different formats safely
 */

const ExportManager = {
    /**
     * Export results as JSON file
     */
    exportJSON() {
        try {
            if (!ResultsDisplay.currentResults) {
                Utils.showError('No results to export');
                return;
            }

            const exportData = ResultsDisplay.getExportData();
            if (!exportData) {
                Utils.showError('Failed to prepare export data');
                return;
            }

            const jsonContent = JSON.stringify(exportData, null, 2);
            const filename = this.generateFilename('json');
            
            Utils.downloadFile(jsonContent, filename, 'application/json');
            Utils.showSuccess('JSON file downloaded successfully');
        } catch (error) {
            console.error('JSON export error:', error);
            Utils.showError('Failed to export JSON file: ' + error.message);
        }
    },

    /**
     * Export results as CSV file
     */
    exportCSV() {
        try {
            if (!ResultsDisplay.currentResults) {
                Utils.showError('No results to export');
                return;
            }

            const csvContent = this.convertToCSV(ResultsDisplay.currentResults);
            if (!csvContent) {
                Utils.showError('Failed to generate CSV content');
                return;
            }

            const filename = this.generateFilename('csv');
            
            Utils.downloadFile(csvContent, filename, 'text/csv');
            Utils.showSuccess('CSV file downloaded successfully');
        } catch (error) {
            console.error('CSV export error:', error);
            Utils.showError('Failed to export CSV file: ' + error.message);
        }
    },

    /**
     * Export filled template (matching original format)
     */
    exportTemplate() {
        try {
            if (!ResultsDisplay.currentResults || !ResultsDisplay.currentProgramme) {
                Utils.showError('No results to export');
                return;
            }

            const templateContent = this.generateFilledTemplate();
            if (!templateContent) {
                Utils.showError('Failed to generate template content');
                return;
            }

            const filename = this.generateFilename('csv', 'filled_template');
            
            Utils.downloadFile(templateContent, filename, 'text/csv');
            Utils.showSuccess('Filled template downloaded successfully');
        } catch (error) {
            console.error('Template export error:', error);
            Utils.showError('Failed to export template: ' + error.message);
        }
    },

    /**
     * Safely escape CSV value to prevent injection
     * @param {any} value - Value to escape
     * @returns {string} Escaped CSV value
     */
    escapeCSVValue(value) {
        if (value === null || value === undefined) {
            return '""';
        }

        let stringValue = value.toString();
        
        // Remove potentially dangerous characters for CSV injection
        stringValue = stringValue.replace(/[=+\-@]/g, '');
        
        // Escape double quotes
        stringValue = stringValue.replace(/"/g, '""');
        
        // Wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue}"`;
        }
        
        return stringValue;
    },

    /**
     * Convert results to CSV format safely
     * @param {Array} results - Analysis results
     * @returns {string} CSV content
     */
    convertToCSV(results) {
        try {
            if (!Array.isArray(results) || results.length === 0) {
                throw new Error('Invalid or empty results data');
            }

            const headers = [
                'HKIT Subject Code',
                'HKIT Subject Name',
                'Exemption Granted / study plan',
                'Subject Name of Previous Studies',
                'Exemption Granted',
                'Remarks'
            ];

            let csv = headers.map(header => this.escapeCSVValue(header)).join(',') + '\n';
            
            results.forEach((result, index) => {
                if (!result || typeof result !== 'object') {
                    console.warn(`Skipping invalid result at index ${index}`);
                    return;
                }

                const row = headers.map(header => {
                    const value = result[header] || '';
                    return this.escapeCSVValue(value);
                });
                csv += row.join(',') + '\n';
            });

            return csv;
        } catch (error) {
            console.error('CSV conversion error:', error);
            throw new Error('Failed to convert results to CSV format');
        }
    },

    /**
     * Generate filled template matching original HKIT format safely
     * @returns {string} Filled template content
     */
    generateFilledTemplate() {
        try {
            const programme = ResultsDisplay.currentProgramme;
            const results = ResultsDisplay.currentResults;
            
            if (!programme || !results) {
                throw new Error('Missing programme or results data');
            }

            // Create template header with safe escaping
            let template = 'APPLICATION FOR ADVANCED STANDING,,,,,,\n';
            template += ',,,,,,\n';
            template += 'Hong Kong Institute of Technology,,,,,,\n';
            template += `${this.escapeCSVValue(programme.fullName)},,,,,,\n`;
            template += ',,,,,,\n';
            // Get intake year from UI
            const intakeYearInput = document.getElementById('intakeYear');
            const intakeYear = intakeYearInput ? intakeYearInput.value : new Date().getFullYear();
            
            // Get academic year level from results section dropdown
            const academicYearSelect = document.getElementById('academicYearLevel');
            const academicYearLevel = academicYearSelect ? academicYearSelect.value : 'Year 2';
            
            template += `Name of Student: ,,${this.escapeCSVValue(programme.name)},,,,\n`;
            template += `Intake Year (HKIT Degree): ,,T${intakeYear}C,,${academicYearLevel},,\n`;
            template += 'Application No.: ,,,,,,\n';
            template += ',,,,,,\n';
            template += 'Total subjects require to study in Higher Diploma:,,,,,,\n';
            template += ',,,,,,\n';
            template += 'HKIT Subject Code,HKIT Subject Name,Exemption Granted / study plan,Subject Name of Previous Studies,,,\n';
            template += ',,,,,,\n';

            // Add course data with results safely
            results.forEach((result, index) => {
                if (!result || typeof result !== 'object') {
                    console.warn(`Skipping invalid result at index ${index}`);
                    return;
                }

                const code = this.escapeCSVValue(result['HKIT Subject Code']);
                const name = this.escapeCSVValue(result['HKIT Subject Name']);
                const exemption = this.escapeCSVValue(result['Exemption Granted / study plan']);
                const previous = this.escapeCSVValue(result['Subject Name of Previous Studies']);
                
                template += `${code},${name},${exemption},${previous},,,\n`;
            });

            // Add template footer
            template += ',,,,,,\n';
            template += ',,,,,,\n';
            template += ',,,,,,\n';
            template += ',,,,,,\n';
            template += ',,,,,,\n';
            template += ',,,,,,\n';
            template += 'Total Units of Advanced Standing Approved:,,,,,,\n';
            template += ',,,,,,\n';
            template += 'Intake Level Approved:,,,,,,\n';
            template += '*delete as appropriate,,,,,,\n';
            template += ',,,,,,\n';
            template += 'Signature:,,,,,,\n';
            template += `Programme Leader (${this.escapeCSVValue(programme.fullName)}),,,,,,\n`;

            return template;
        } catch (error) {
            console.error('Template generation error:', error);
            throw new Error('Failed to generate filled template');
        }
    },

    /**
     * Generate filename with timestamp safely
     * @param {string} extension - File extension
     * @param {string} prefix - Optional filename prefix
     * @returns {string} Generated filename
     */
    generateFilename(extension, prefix = 'hkit_analysis') {
        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const programmeName = ResultsDisplay.currentProgramme?.id || 'unknown';
            
            // Get intake year from UI
            const intakeYearInput = document.getElementById('intakeYear');
            const intakeYear = intakeYearInput ? intakeYearInput.value : new Date().getFullYear();
            
            // Sanitize filename components
            const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
            const safeProgramme = programmeName.replace(/[^a-zA-Z0-9_-]/g, '_');
            const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, '');
            const safeIntakeYear = intakeYear.toString().replace(/[^0-9]/g, '');
            
            return `${safePrefix}_${safeProgramme}_${safeIntakeYear}_${timestamp}.${safeExtension}`;
        } catch (error) {
            console.error('Filename generation error:', error);
            return `hkit_export_${Date.now()}.${extension}`;
        }
    },

    /**
     * Export summary report safely
     */
    exportSummary() {
        try {
            if (!ResultsDisplay.currentResults || !ResultsDisplay.currentProgramme) {
                Utils.showError('No results to export');
                return;
            }

            const exportData = ResultsDisplay.getExportData();
            if (!exportData) {
                Utils.showError('Failed to prepare export data');
                return;
            }

            const summary = this.generateSummaryReport(exportData);
            if (!summary) {
                Utils.showError('Failed to generate summary report');
                return;
            }

            const filename = this.generateFilename('txt', 'summary_report');
            
            Utils.downloadFile(summary, filename, 'text/plain');
            Utils.showSuccess('Summary report downloaded successfully');
        } catch (error) {
            console.error('Summary export error:', error);
            Utils.showError('Failed to export summary report: ' + error.message);
        }
    },

    /**
     * Generate summary report text safely
     * @param {Object} exportData - Export data object
     * @returns {string} Summary report content
     */
    generateSummaryReport(exportData) {
        try {
            if (!exportData || typeof exportData !== 'object') {
                throw new Error('Invalid export data');
            }

            const { results, programme, summary, timestamp } = exportData;
            
            if (!results || !programme || !summary) {
                throw new Error('Missing required data for summary report');
            }
            
            let report = '='.repeat(60) + '\n';
            report += 'HKIT COURSE EXEMPTION ANALYSIS REPORT\n';
            report += '='.repeat(60) + '\n\n';
            
            report += `Programme: ${programme.fullName || 'Unknown'}\n`;
            report += `Analysis Date: ${new Date(timestamp).toLocaleString()}\n`;
            report += `Total Courses Analyzed: ${summary.total || 0}\n\n`;
            
            report += 'SUMMARY:\n';
            report += `---------\n`;
            const exemptionRate = summary.total > 0 ? Math.round((summary.exempted/summary.total)*100) : 0;
            const requiredRate = summary.total > 0 ? Math.round((summary.required/summary.total)*100) : 0;
            report += `Exemptions Granted: ${summary.exempted || 0} (${exemptionRate}%)\n`;
            report += `Courses Required: ${summary.required || 0} (${requiredRate}%)\n\n`;
            
            // Exempted courses
            const exempted = results.filter(r => r['Exemption Granted'] === 'TRUE');
            if (exempted.length > 0) {
                report += 'EXEMPTED COURSES:\n';
                report += '-----------------\n';
                exempted.forEach(course => {
                    report += `${course['HKIT Subject Code'] || 'N/A'}: ${course['HKIT Subject Name'] || 'N/A'}\n`;
                    report += `  Previous Study: ${course['Subject Name of Previous Studies'] || 'N/A'}\n`;
                    report += `  Reason: ${course['Remarks'] || 'N/A'}\n\n`;
                });
            }
            
            // Required courses
            const required = results.filter(r => r['Exemption Granted'] === 'FALSE');
            if (required.length > 0) {
                report += 'COURSES REQUIRED TO STUDY:\n';
                report += '--------------------------\n';
                required.forEach(course => {
                    report += `${course['HKIT Subject Code'] || 'N/A'}: ${course['HKIT Subject Name'] || 'N/A'}\n`;
                    report += `  Reason: ${course['Remarks'] || 'N/A'}\n\n`;
                });
            }
            
            return report;
        } catch (error) {
            console.error('Summary report generation error:', error);
            throw new Error('Failed to generate summary report');
        }
    }
};

/**
 * Global export functions (called from HTML) - safely wrapped
 */
function exportJSON() {
    try {
        ExportManager.exportJSON();
    } catch (error) {
        console.error('Export JSON error:', error);
        if (typeof Utils !== 'undefined' && Utils.showError) {
            Utils.showError('Failed to export JSON file');
        }
    }
}

function exportCSV() {
    try {
        ExportManager.exportCSV();
    } catch (error) {
        console.error('Export CSV error:', error);
        if (typeof Utils !== 'undefined' && Utils.showError) {
            Utils.showError('Failed to export CSV file');
        }
    }
}

function exportTemplate() {
    try {
        ExportManager.exportTemplate();
    } catch (error) {
        console.error('Export template error:', error);
        if (typeof Utils !== 'undefined' && Utils.showError) {
            Utils.showError('Failed to export template');
        }
    }
}

function exportSummary() {
    try {
        ExportManager.exportSummary();
    } catch (error) {
        console.error('Export summary error:', error);
        if (typeof Utils !== 'undefined' && Utils.showError) {
            Utils.showError('Failed to export summary report');
        }
    }
}
