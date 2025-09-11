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

        // 收集科目名稱到 SubjectCollector
        if (typeof SubjectCollector !== 'undefined') {
            SubjectCollector.collectFromResults(results);
        }

        // 記錄分析結果到 StorageManager 以進行學習
        if (typeof StorageManager !== 'undefined') {
            const studentInfo = (typeof StudentInfoManager !== 'undefined') ? 
                StudentInfoManager.getStudentInfo() : {};
            StorageManager.recordAnalysisResults(results, studentInfo);
        }

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
        const exempted = this.currentResults.filter(r => r['Exemption Granted'] === 'TRUE').length;
        const required = total - exempted;
        const exemptionRate = Math.round((exempted / total) * 100);

        summaryElement.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <h4>📊 Analysis Summary</h4>
                    <p><strong>Programme:</strong> ${this.currentProgramme.name}</p>
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
    async displayTable() {
        const tableContainer = document.getElementById('tableView');
        if (!tableContainer || !this.currentResults) return;

        // 獲取學生資訊
        const studentInfo = (typeof StudentInfoManager !== 'undefined') ? 
            StudentInfoManager.getStudentInfo() : { name: '', applicationNumber: '', appliedProgramme: '' };

        // 獲取信心指標
        const enrichedResults = await this.enrichWithConfidenceData(this.currentResults);

        // 整合學生資訊到每一行數據
        const dataWithStudentInfo = enrichedResults.map(row => ({
            'Student Name': studentInfo.name || '未填寫',
            'Application Number': studentInfo.applicationNumber || '未填寫',
            'Applied Programme': studentInfo.appliedProgramme || '未填寫',
            ...row
        }));

        const headers = Object.keys(dataWithStudentInfo[0]);

        const tableHTML = `
            <div class="overflow-x-auto">
                <table class="w-full table-auto results-table">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            ${headers.map(h => `<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 ${this.getHeaderClass(h)}">${this.getHeaderText(h)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${dataWithStudentInfo.map(result => `
                            <tr class="hover:bg-gray-50">
                                ${headers.map(h => `<td class="px-4 py-3 text-sm ${this.getCellClass(h)}">${this.formatCell(h, result[h], result)}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Confidence Legend -->
            <div class="confidence-legend" style="margin-top: 15px; padding: 10px; background: #f7fafc; border-radius: 8px; font-size: 0.8rem;">
                <strong>信心指標說明:</strong>
                <span class="confidence-indicator high" style="background: #48bb78; color: white; padding: 2px 6px; border-radius: 4px; margin: 0 4px;">高</span>
                <span class="confidence-indicator medium" style="background: #ed8936; color: white; padding: 2px 6px; border-radius: 4px; margin: 0 4px;">中</span>
                <span class="confidence-indicator low" style="background: #e53e3e; color: white; padding: 2px 6px; border-radius: 4px; margin: 0 4px;">低</span>
                <span class="confidence-indicator none" style="background: #a0aec0; color: white; padding: 2px 6px; border-radius: 4px; margin: 0 4px;">新</span>
            </div>
        `;

        tableContainer.innerHTML = tableHTML;
    },

    /**
     * Enrich results with confidence data from historical patterns
     */
    async enrichWithConfidenceData(results) {
        if (typeof StorageManager === 'undefined') {
            return results; // Return original if StorageManager not available
        }

        const enrichedResults = [];
        
        for (const result of results) {
            const previousSubject = result['Subject Name of Previous Studies'];
            const hkitSubject = result['HKIT Subject Code'];
            
            let confidenceScore = null;
            let historicalCount = 0;
            
            if (previousSubject && hkitSubject) {
                try {
                    const pattern = await StorageManager.getExemptionPattern(previousSubject, hkitSubject);
                    if (pattern) {
                        confidenceScore = pattern.confidence;
                        historicalCount = pattern.count || 0;
                    }
                } catch (error) {
                    console.warn('Failed to get confidence data:', error);
                }
            }
            
            enrichedResults.push({
                ...result,
                'Confidence Score': confidenceScore,
                'Historical Count': historicalCount
            });
        }
        
        return enrichedResults;
    },

    /**
     * Get header text with icons for new columns
     */
    getHeaderText(header) {
        if (header === 'Confidence Score') {
            return '🎯 信心指標';
        } else if (header === 'Historical Count') {
            return '📊 歷史次數';
        }
        return header;
    },

    /**
     * 格式化儲存格內容
     */
    formatCell(header, value, fullRowData = null) {
        if (value === null || value === undefined || value === '') {
            // Handle new confidence columns differently
            if (header === 'Confidence Score' || header === 'Historical Count') {
                return '<span class="text-gray-400 text-xs">-</span>';
            }
            return '-';
        }
        
        // 學生資訊欄位特殊樣式
        if (this.isStudentInfoField(header)) {
            if (value === '未填寫') {
                return `<span class="text-gray-400 italic">${value}</span>`;
            }
            return `<span class="text-blue-700 font-medium">${value}</span>`;
        }
        
        // 信心指標顯示
        if (header === 'Confidence Score') {
            return this.formatConfidenceScore(value);
        }
        
        // 歷史次數顯示
        if (header === 'Historical Count') {
            return this.formatHistoricalCount(value);
        }
        
        if (header === 'Exemption Granted' || header === 'Exemption Granted / study plan') {
            // 處理豁免狀態
            if (header === 'Exemption Granted') {
                const isExempt = value === true || value === 'true' || value === 'TRUE';
                const confidenceScore = fullRowData ? fullRowData['Confidence Score'] : null;
                const confidenceClass = this.getConfidenceClass(confidenceScore);
                
                return `<div class="flex items-center space-x-2">
                    <span class="exemption-badge ${isExempt ? 'exemption-true' : 'exemption-false'}">
                        ${isExempt ? '✅ 豁免' : '❌ 不豁免'}
                    </span>
                    ${confidenceScore !== null ? `<span class="confidence-dot ${confidenceClass}" title="信心指標: ${(confidenceScore * 100).toFixed(0)}%"></span>` : ''}
                </div>`;
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
     * 格式化信心指標分數
     */
    formatConfidenceScore(score) {
        if (score === null || score === undefined) {
            return '<span class="confidence-indicator none">新</span>';
        }
        
        const percentage = Math.round(score * 100);
        const level = this.getConfidenceLevel(score);
        const className = this.getConfidenceClass(score);
        
        return `<span class="confidence-indicator ${className}" title="${percentage}% 信心度">${level}</span>`;
    },

    /**
     * 格式化歷史次數
     */
    formatHistoricalCount(count) {
        if (!count || count === 0) {
            return '<span class="text-gray-400 text-xs">0</span>';
        }
        
        const countText = count > 99 ? '99+' : count.toString();
        return `<span class="historical-count text-xs font-medium text-blue-600" title="歷史出現 ${count} 次">${countText}</span>`;
    },

    /**
     * 獲取信心指標等級
     */
    getConfidenceLevel(score) {
        if (score >= 0.8) return '高';
        if (score >= 0.6) return '中';
        if (score >= 0.3) return '低';
        return '新';
    },

    /**
     * 獲取信心指標樣式類別
     */
    getConfidenceClass(score) {
        if (score === null || score === undefined) return 'none';
        if (score >= 0.8) return 'high';
        if (score >= 0.6) return 'medium';
        if (score >= 0.3) return 'low';
        return 'none';
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
        if (header === 'Confidence Score') {
            return 'min-w-0 max-w-20 text-center';
        }
        if (header === 'Historical Count') {
            return 'min-w-0 max-w-16 text-center';
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
