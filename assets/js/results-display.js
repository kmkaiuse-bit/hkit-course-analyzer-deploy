/**
 * Results Display
 * Handles formatting and displaying analysis results
 */

const ResultsDisplay = {
    currentResults: null,
    currentProgramme: null,

    /**
     * Display analysis results
     * @param {Array} results - Analysis results from Gemini
     * @param {string} programmeId - Programme ID
     */
    showResults(results, programmeId) {
        this.currentResults = results;
        this.currentProgramme = TemplateManager.getProgramme(programmeId);

        // 設置編輯模式數據
        if (typeof EditModeController !== 'undefined' && EditModeController.setCurrentData) {
            EditModeController.setCurrentData(results);
        }

        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        
        // 顯示學生資訊卡片（如果已填寫）
        this.showStudentInfoIfAvailable();

        // Display summary stats
        this.displaySummary();

        // Display table view (default)
        this.displayTable();

        // Display JSON view
        this.displayJSON();
        
        // 顯示編輯按鈕
        this.showEditButton();
    },

    /**
     * 顯示學生資訊卡片（如果已填寫）
     */
    showStudentInfoIfAvailable() {
        if (typeof StudentInfoManager === 'undefined') return;
        
        const studentInfo = StudentInfoManager.getStudentInfo();
        const displayCard = document.getElementById('studentInfoDisplay');
        
        if (studentInfo && studentInfo.name && displayCard) {
            displayCard.style.display = 'block';
        }
    },

    /**
     * 顯示編輯按鈕
     */
    showEditButton() {
        const editBtn = document.getElementById('editBtn');
        const resetBtn = document.getElementById('resetBtn');
        const studyPlanBtn = document.getElementById('generateStudyPlanBtn');
        
        if (editBtn) editBtn.style.display = 'inline-block';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        
        // 顯示排課計劃按鈕
        if (studyPlanBtn && typeof StudyPlanGenerator !== 'undefined') {
            StudyPlanGenerator.showStudyPlanButton();
        }
        
        // 顯示專業匯出按鈕
        if (typeof AdvancedExporter !== 'undefined' && AdvancedExporter.showExportButtons) {
            AdvancedExporter.showExportButtons();
        }
    },

    /**
     * 渲染可編輯表格（由 EditModeController 呼叫）
     */
    renderEditableTable(data) {
        if (typeof EditModeController !== 'undefined' && EditModeController.renderEditableTable) {
            EditModeController.renderEditableTable();
        }
    },

    /**
     * 渲染一般表格（非編輯模式）
     */
    renderTable(data) {
        this.currentResults = data || this.currentResults;
        this.displayTable();
    },

    /**
     * 更新當前結果數據（由 EditModeController 呼叫）
     */
    updateCurrentResults(data) {
        this.currentResults = data;
        this.displaySummary(); // 更新統計資訊
        this.displayTable(); // 重新顯示表格
        this.displayJSON(); // 更新 JSON 顯示
    },

    /**
     * Display summary statistics
     */
    displaySummary() {
        const summaryElement = document.getElementById('summaryStats');
        if (!summaryElement || !this.currentResults) return;

        const total = this.currentResults.length;
        // Fix: Check for both boolean true and string 'TRUE'
        const exempted = this.currentResults.filter(r => {
            const exemptionValue = r['Exemption Granted'];
            return exemptionValue === true || 
                   exemptionValue === 'true' || 
                   exemptionValue === 'TRUE';
        }).length;
        
        const required = total - exempted;
        const exemptionRate = total > 0 ? Math.round((exempted / total) * 100) : 0;

        summaryElement.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <h4>📊 Analysis Summary</h4>
                    <p><strong>Programme:</strong> ${this.currentProgramme?.name || 'N/A'}</p>
                    <p><strong>Total Courses:</strong> ${total}</p>
                    <p><strong>Exemptions Granted:</strong> ${exempted} (${exemptionRate}%)</p>
                    <p><strong>Courses Required:</strong> ${required}</p>
                </div>
            </div>
        `;
    },

    /**
     * Display results in table format
     */
    displayTable() {
        const tableContainer = document.getElementById('tableView');
        if (!tableContainer || !this.currentResults) return;

        // 獲取學生資訊
        const studentInfo = (typeof StudentInfoManager !== 'undefined') ? 
            StudentInfoManager.getStudentInfo() : { name: '', applicationNumber: '', appliedProgramme: '' };

        // 整合學生資訊到每一行數據
        const dataWithStudentInfo = this.currentResults.map(row => ({
            'Student Name': studentInfo.name || '',
            'Application Number': studentInfo.applicationNumber || '',
            'Applied Programme': studentInfo.appliedProgramme || '',
            ...row
        }));

        const headers = Object.keys(dataWithStudentInfo[0]);

        const tableHTML = `
            <div class="overflow-x-auto">
                <table class="w-full table-auto results-table">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            ${headers.map(h => `<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 ${this.getHeaderClass(h)}">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${dataWithStudentInfo.map(result => `
                            <tr class="hover:bg-gray-50">
                                ${headers.map(h => `<td class="px-4 py-3 text-sm ${this.getCellClass(h)}">${this.formatCell(h, result[h])}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        tableContainer.innerHTML = tableHTML;
    },

    /**
     * 格式化儲存格內容
     */
    formatCell(header, value) {
        if (value === null || value === undefined || value === '') return '-';
        
        // 學生資訊欄位特殊樣式
        if (this.isStudentInfoField(header)) {
            if (!value || value === '') {
                return '-';
            }
            return `<span class="text-blue-700 font-medium">${value}</span>`;
        }
        
        if (header === 'Exemption Granted' || header === 'Exemption Granted / study plan') {
            // 處理豁免狀態
            if (header === 'Exemption Granted') {
                // Only TRUE means exempted, everything else (including empty) is not exempted
                const isExempt = value === true || value === 'true' || value === 'TRUE';
                return `<span class="exemption-badge ${isExempt ? 'exemption-true' : 'exemption-false'}">
                    ${isExempt ? '✅ 豁免' : '❌ 不豁免'}
                </span>`;
            } else {
                // study plan 欄位
                return value === 'Exempted' ? 
                    `<span class="text-green-600 font-medium">${value}</span>` : 
                    `<span class="text-blue-600">${value}</span>`;
            }
        }
        
        return String(value);
    },

    /**
     * 判斷是否為學生資訊欄位
     */
    isStudentInfoField(header) {
        return ['Student Name', 'Application Number', 'Applied Programme'].includes(header);
    },

    /**
     * 取得儲存格樣式類別
     */
    getCellClass(header) {
        if (header === 'Subject Name of Previous Studies') {
            return 'max-w-xs min-w-0 truncate';
        }
        if (header === 'Remarks') {
            return 'max-w-sm min-w-0 break-words';
        }
        if (this.isStudentInfoField(header)) {
            return 'bg-blue-50 font-medium max-w-xs min-w-0';
        }
        if (header === 'HKIT Subject Code') {
            return 'min-w-0 max-w-24';
        }
        if (header === 'HKIT Subject Name') {
            return 'min-w-0 max-w-sm';
        }
        return 'min-w-0';
    },

    /**
     * 取得表頭樣式類別
     */
    getHeaderClass(header) {
        if (this.isStudentInfoField(header)) {
            return 'bg-blue-100 text-blue-800';
        }
        return '';
    },

    /**
     * Display results in JSON format
     */
    displayJSON() {
        const jsonContainer = document.getElementById('jsonOutput');
        if (!jsonContainer || !this.currentResults) return;

        const formattedJSON = JSON.stringify(this.currentResults, null, 2);
        jsonContainer.textContent = formattedJSON;
    },

    /**
     * Switch between table and JSON view
     */
    switchView() {
        const viewMode = document.querySelector('input[name="viewMode"]:checked').value;
        const tableView = document.getElementById('tableView');
        const jsonView = document.getElementById('jsonView');

        if (viewMode === 'table') {
            tableView.style.display = 'block';
            jsonView.style.display = 'none';
        } else {
            tableView.style.display = 'none';
            jsonView.style.display = 'block';
        }
    },

    /**
     * Get exempted courses
     * @returns {Array} Array of exempted courses
     */
    getExemptedCourses() {
        if (!this.currentResults) return [];
        return this.currentResults.filter(r => r['Exemption Granted'] === 'TRUE');
    },

    /**
     * Get required courses
     * @returns {Array} Array of required courses
     */
    getRequiredCourses() {
        if (!this.currentResults) return [];
        return this.currentResults.filter(r => r['Exemption Granted'] === 'FALSE');
    },

    /**
     * Clear all results
     */
    clearResults() {
        this.currentResults = null;
        this.currentProgramme = null;
        
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
        
        // 隱藏專業匯出按鈕
        if (typeof AdvancedExporter !== 'undefined' && AdvancedExporter.hideExportButtons) {
            AdvancedExporter.hideExportButtons();
        }
    },

    /**
     * Get results for export
     * @returns {Object} Results data for export
     */
    getExportData() {
        return {
            results: this.currentResults,
            programme: this.currentProgramme,
            timestamp: Utils.getCurrentTimestamp(),
            summary: {
                total: this.currentResults?.length || 0,
                exempted: this.getExemptedCourses().length,
                required: this.getRequiredCourses().length
            }
        };
    }
};

/**
 * Global function for switching views (called from HTML)
 */
function switchView() {
    ResultsDisplay.switchView();
}
