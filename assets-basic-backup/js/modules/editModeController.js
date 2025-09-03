/**
 * 編輯模式控制模組
 * 從 test-ui.html 整合而來，提供結果表格的編輯功能
 */

const EditModeController = {
    // 編輯狀態
    isEditMode: false,
    originalData: [],
    currentData: [],

    /**
     * 初始化編輯模式控制器
     */
    init() {
        this.setupEventListeners();
        console.log('✅ EditModeController initialized');
    },

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 編輯按鈕
        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.enterEditMode());
        }

        // 保存按鈕
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveChanges());
        }

        // 取消按鈕
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        // 重置按鈕
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToOriginal());
        }
    },

    /**
     * 設置當前數據（由 ResultsDisplay 調用）
     */
    setCurrentData(data) {
        this.currentData = [...data];
        this.originalData = [...data];
        console.log('📊 編輯模式數據已設置:', this.currentData.length, '筆記錄');
    },

    /**
     * 進入編輯模式
     */
    enterEditMode() {
        try {
            this.isEditMode = true;
            this.originalData = JSON.parse(JSON.stringify(this.currentData));
            
            // 更新按鈕顯示
            this.updateButtonsForEditMode(true);
            
            // 重新渲染表格為編輯模式
            if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.renderEditableTable) {
                ResultsDisplay.renderEditableTable(this.currentData);
            } else {
                this.renderEditableTable();
            }
            
            // 添加編輯事件監聽器
            this.addEditEventListeners();
            
            console.log('✏️ 已進入編輯模式');
        } catch (error) {
            console.error('進入編輯模式失敗:', error);
        }
    },

    /**
     * 退出編輯模式
     */
    exitEditMode() {
        try {
            this.isEditMode = false;
            
            // 更新按鈕顯示
            this.updateButtonsForEditMode(false);
            
            // 重新渲染表格為檢視模式
            if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.renderTable) {
                ResultsDisplay.renderTable(this.currentData);
            }
            
            console.log('👁️ 已退出編輯模式');
        } catch (error) {
            console.error('退出編輯模式失敗:', error);
        }
    },

    /**
     * 更新按鈕顯示狀態
     */
    updateButtonsForEditMode(isEditMode) {
        const editBtn = document.getElementById('editBtn');
        const saveBtn = document.getElementById('saveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const resetBtn = document.getElementById('resetBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const studyPlanBtn = document.getElementById('generateStudyPlanBtn');

        if (isEditMode) {
            // 編輯模式：隱藏編輯、重置和排課，顯示保存和取消
            if (editBtn) editBtn.style.display = 'none';
            if (resetBtn) resetBtn.style.display = 'none';
            if (studyPlanBtn) studyPlanBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'inline-block';
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (analyzeBtn) analyzeBtn.disabled = true;
        } else {
            // 檢視模式：顯示編輯、重置和排課，隱藏保存和取消
            if (editBtn) editBtn.style.display = 'inline-block';
            if (resetBtn) resetBtn.style.display = 'inline-block';
            if (studyPlanBtn) studyPlanBtn.style.display = 'inline-block';
            if (saveBtn) saveBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (analyzeBtn) analyzeBtn.disabled = false;
        }
    },

    /**
     * 渲染可編輯表格
     */
    renderEditableTable() {
        const tableView = document.getElementById('tableView');
        if (!tableView || !this.currentData.length) return;

        // 獲取學生資訊
        const studentInfo = (typeof StudentInfoManager !== 'undefined') ? 
            StudentInfoManager.getStudentInfo() : { name: '', applicationNumber: '', appliedProgramme: '' };

        // 整合學生資訊到每行數據
        const dataWithStudentInfo = this.currentData.map(row => ({
            'Student Name': studentInfo.name || '未填寫',
            'Application Number': studentInfo.applicationNumber || '未填寫',
            'Applied Programme': studentInfo.appliedProgramme || '未填寫',
            ...row
        }));

        const headers = Object.keys(dataWithStudentInfo[0]);

        const tableHTML = `
            <div class="overflow-x-auto">
                <table class="w-full table-auto results-table" id="editableResultsTable">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            ${headers.map(h => `<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 ${this.getHeaderClass(h)}">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${dataWithStudentInfo.map((row, index) => `
                            <tr class="hover:bg-gray-50" data-row-index="${index}">
                                ${headers.map(h => `<td class="px-4 py-3 text-sm ${this.getCellClass(h)}" data-header="${h}">
                                    ${this.isStudentInfoField(h) ? this.formatDisplayCell(h, row[h]) : this.formatEditableCell(h, row[h], index)}
                                </td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        tableView.innerHTML = tableHTML;
    },

    /**
     * 格式化可編輯儲存格
     */
    formatEditableCell(header, value, rowIndex) {
        if (header === 'Exemption Granted') {
            const isExempt = value === true || value === 'true';
            return `
                <select class="editable-select px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-full" data-row="${rowIndex}" data-header="${header}">
                    <option value="true" ${isExempt ? 'selected' : ''}>✅ 豁免</option>
                    <option value="false" ${!isExempt ? 'selected' : ''}>❌ 不豁免</option>
                </select>
            `;
        } else if (header === 'Exemption Granted / study plan') {
            // 提供更多的 term 選項
            const termOptions = [
                { value: 'Exempted', label: 'Exempted' },
                { value: '', label: '空白' },
                { value: 'T2025A', label: 'T2025A' },
                { value: 'T2025C', label: 'T2025C' },
                { value: 'T2026A', label: 'T2026A' },
                { value: 'T2026C', label: 'T2026C' },
                { value: 'T2027A', label: 'T2027A' },
                { value: 'T2027C', label: 'T2027C' }
            ];
            const options = termOptions.map(opt => 
                `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
            ).join('');
            return `
                <select class="editable-select px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-full" data-row="${rowIndex}" data-header="${header}">
                    ${options}
                </select>
            `;
        } else {
            const displayValue = value === null || value === undefined ? '' : String(value);
            const isLongField = header === 'Subject Name of Previous Studies' || header === 'Remarks';
            const inputClass = isLongField ? 
                'editable-input px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-xs break-words' :
                'editable-input px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-full';
            
            return `<input type="text" class="${inputClass}" value="${displayValue.replace(/"/g, '&quot;')}" data-row="${rowIndex}" data-header="${header}">`;
        }
    },

    /**
     * 判斷是否為學生資訊欄位
     */
    isStudentInfoField(header) {
        return ['Student Name', 'Application Number', 'Applied Programme'].includes(header);
    },

    /**
     * 格式化顯示儲存格
     */
    formatDisplayCell(header, value) {
        if (this.isStudentInfoField(header)) {
            if (value === '未填寫') {
                return `<span class="text-gray-400 italic">${value}</span>`;
            }
            return `<span class="text-blue-700 font-medium">${value}</span>`;
        }
        return this.formatCell(header, value);
    },

    /**
     * 格式化儲存格內容
     */
    formatCell(header, value) {
        if (value === null || value === undefined || value === '') return '-';
        
        if (header === 'Exemption Granted') {
            const isExempt = value === true || value === 'true';
            return `<span class="px-2 py-1 rounded text-xs ${isExempt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${isExempt ? '✅ 豁免' : '❌ 不豁免'}</span>`;
        }
        
        return String(value);
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
     * 添加編輯事件監聽器
     */
    addEditEventListeners() {
        const editableInputs = document.querySelectorAll('.editable-input, .editable-select');
        
        editableInputs.forEach(input => {
            input.addEventListener('change', (event) => {
                const rowIndex = parseInt(event.target.dataset.row);
                const header = event.target.dataset.header;
                let value = event.target.value;
                
                // 跳過學生資訊欄位
                if (this.isStudentInfoField(header)) {
                    return;
                }
                
                // 處理特殊欄位
                if (header === 'Exemption Granted') {
                    value = value === 'true';
                } else if (header === 'Exemption Granted / study plan') {
                    // 自動同步 Exemption Granted 欄位
                    this.currentData[rowIndex]['Exemption Granted'] = (value === 'Exempted') ? 'TRUE' : 'FALSE';
                    console.log(`🔄 自動更新: 第${rowIndex}行, Exemption Granted = ${this.currentData[rowIndex]['Exemption Granted']}`);
                }
                
                this.currentData[rowIndex][header] = value;
                console.log(`📝 已更新: 第${rowIndex}行, ${header} = ${value}`);
            });
        });
    },

    /**
     * 保存修改
     */
    saveChanges() {
        try {
            // 收集所有編輯欄位的數據
            const editableInputs = document.querySelectorAll('.editable-input, .editable-select');
            
            editableInputs.forEach(input => {
                const rowIndex = parseInt(input.dataset.row);
                const header = input.dataset.header;
                let value = input.value;
                
                // 跳過學生資訊欄位
                if (this.isStudentInfoField(header)) {
                    return;
                }
                
                // 處理特殊欄位
                if (header === 'Exemption Granted') {
                    value = value === 'true';
                }
                
                this.currentData[rowIndex][header] = value;
            });
            
            // 更新 ResultsDisplay 的數據
            if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.updateCurrentResults) {
                ResultsDisplay.updateCurrentResults(this.currentData);
            }
            
            console.log('💾 修改已保存:', this.currentData);
            this.exitEditMode();
            
            // 顯示成功訊息
            this.showSaveSuccess();
        } catch (error) {
            console.error('保存修改失敗:', error);
            alert('保存失敗，請重試');
        }
    },

    /**
     * 取消編輯
     */
    cancelEdit() {
        try {
            // 恢復原始數據
            this.currentData = JSON.parse(JSON.stringify(this.originalData));
            
            // 更新 ResultsDisplay 的數據
            if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.updateCurrentResults) {
                ResultsDisplay.updateCurrentResults(this.currentData);
            }
            
            console.log('🚫 編輯已取消');
            this.exitEditMode();
        } catch (error) {
            console.error('取消編輯失敗:', error);
        }
    },

    /**
     * 重置到原始數據
     */
    resetToOriginal() {
        if (confirm('確定要重置到原始分析結果嗎？所有的修改都將會遺失。')) {
            try {
                this.currentData = JSON.parse(JSON.stringify(this.originalData));
                
                // 更新 ResultsDisplay 的數據
                if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.updateCurrentResults) {
                    ResultsDisplay.updateCurrentResults(this.currentData);
                }
                
                console.log('🔄 已重置到原始數據');
                
                // 如果在編輯模式，重新渲染
                if (this.isEditMode) {
                    this.renderEditableTable();
                }
            } catch (error) {
                console.error('重置失敗:', error);
            }
        }
    },

    /**
     * 顯示保存成功訊息
     */
    showSaveSuccess() {
        const saveBtn = document.getElementById('saveBtn');
        if (!saveBtn) return;
        
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '✅ 已保存';
        saveBtn.classList.add('bg-green-600');
        saveBtn.classList.remove('bg-green-600');
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('bg-green-600');
            saveBtn.classList.add('bg-green-600');
        }, 2000);
    },

    /**
     * 獲取當前數據（供其他模組使用）
     */
    getCurrentData() {
        return [...this.currentData];
    },

    /**
     * 檢查是否處於編輯模式
     */
    isInEditMode() {
        return this.isEditMode;
    }
};

// 全域函數（供 HTML onclick 使用）
window.enterEditMode = () => EditModeController.enterEditMode();
window.saveChanges = () => EditModeController.saveChanges();
window.cancelEdit = () => EditModeController.cancelEdit();
window.resetToOriginal = () => EditModeController.resetToOriginal();