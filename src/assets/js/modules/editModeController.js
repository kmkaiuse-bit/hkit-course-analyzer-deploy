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
        } else if (header === 'Subject Name of Previous Studies') {
            return this.formatSubjectDropdown(value, rowIndex, header);
        } else {
            const displayValue = value === null || value === undefined ? '' : String(value);
            const isLongField = header === 'Remarks';
            const inputClass = isLongField ? 
                'editable-input px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-xs break-words' :
                'editable-input px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-full';
            
            return `<input type="text" class="${inputClass}" value="${displayValue.replace(/"/g, '&quot;')}" data-row="${rowIndex}" data-header="${header}">`;
        }
    },

    /**
     * 格式化學科名稱下拉選單
     */
    formatSubjectDropdown(value, rowIndex, header) {
        const displayValue = value === null || value === undefined ? '' : String(value);
        const uniqueId = `subject-dropdown-${rowIndex}`;
        
        // Get available subjects from SubjectCollector if available
        const availableSubjects = (typeof SubjectCollector !== 'undefined') ? 
            SubjectCollector.getAllSubjects() : [];
        
        // Create options for dropdown
        let options = '<option value="">-- 選擇科目或輸入新科目 --</option>';
        if (displayValue && !availableSubjects.includes(displayValue)) {
            options += `<option value="${displayValue.replace(/"/g, '&quot;')}" selected>✨ ${displayValue}</option>`;
        }
        
        availableSubjects.forEach(subject => {
            const selected = subject === displayValue ? 'selected' : '';
            options += `<option value="${subject.replace(/"/g, '&quot;')}" ${selected}>${subject}</option>`;
        });
        
        options += '<option value="__CUSTOM__">💭 輸入自定義科目...</option>';
        
        return `
            <div class="subject-dropdown-container" data-row="${rowIndex}">
                <select class="editable-select subject-dropdown px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-xs" 
                        data-row="${rowIndex}" data-header="${header}" id="${uniqueId}">
                    ${options}
                </select>
                <input type="text" 
                       class="editable-input custom-subject-input px-2 py-1 border border-gray-300 rounded text-xs w-full max-w-xs" 
                       style="display: none;" 
                       placeholder="輸入科目名稱..." 
                       data-row="${rowIndex}" 
                       data-header="${header}">
                <div class="autocomplete-suggestions" 
                     style="position: absolute; z-index: 1000; background: white; border: 1px solid #ccc; border-radius: 4px; max-height: 200px; overflow-y: auto; display: none; width: 100%;">
                </div>
            </div>
        `;
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
        
        // 添加學科下拉選單的特殊處理
        this.addSubjectDropdownEventListeners();
    },

    /**
     * 添加學科下拉選單的事件監聽器
     */
    addSubjectDropdownEventListeners() {
        const subjectDropdowns = document.querySelectorAll('.subject-dropdown');
        
        subjectDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', (event) => {
                const container = event.target.closest('.subject-dropdown-container');
                const customInput = container.querySelector('.custom-subject-input');
                
                if (event.target.value === '__CUSTOM__') {
                    // 顯示自定義輸入框
                    event.target.style.display = 'none';
                    customInput.style.display = 'block';
                    customInput.focus();
                    
                    // 設置自動完成
                    this.setupAutocomplete(customInput);
                } else {
                    // 使用選擇的值
                    const rowIndex = parseInt(event.target.dataset.row);
                    const header = event.target.dataset.header;
                    
                    this.currentData[rowIndex][header] = event.target.value;
                    console.log(`📝 已更新科目: 第${rowIndex}行, ${header} = ${event.target.value}`);
                    
                    // 添加到 SubjectCollector（如果是新科目）
                    if (event.target.value && typeof SubjectCollector !== 'undefined') {
                        SubjectCollector.addSubject(event.target.value);
                    }
                }
            });
        });
        
        // 為自定義輸入框添加事件監聽器
        const customInputs = document.querySelectorAll('.custom-subject-input');
        customInputs.forEach(input => {
            // 失焦事件 - 切換回下拉選單
            input.addEventListener('blur', (event) => {
                const container = event.target.closest('.subject-dropdown-container');
                const dropdown = container.querySelector('.subject-dropdown');
                const suggestionBox = container.querySelector('.autocomplete-suggestions');
                
                setTimeout(() => {
                    const value = event.target.value.trim();
                    
                    if (value) {
                        // 更新數據
                        const rowIndex = parseInt(event.target.dataset.row);
                        const header = event.target.dataset.header;
                        
                        this.currentData[rowIndex][header] = value;
                        console.log(`📝 已更新自定義科目: 第${rowIndex}行, ${header} = ${value}`);
                        
                        // 添加到 SubjectCollector
                        if (typeof SubjectCollector !== 'undefined') {
                            SubjectCollector.addSubject(value);
                        }
                        
                        // 更新下拉選單選項
                        this.updateDropdownWithNewSubject(dropdown, value);
                    }
                    
                    // 隱藏輸入框，顯示下拉選單
                    event.target.style.display = 'none';
                    dropdown.style.display = 'block';
                    suggestionBox.style.display = 'none';
                }, 150); // 延遲以允許點選建議項目
            });
            
            // 按鍵事件
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.target.blur(); // 觸發失焦事件
                } else if (event.key === 'Escape') {
                    const container = event.target.closest('.subject-dropdown-container');
                    const dropdown = container.querySelector('.subject-dropdown');
                    const suggestionBox = container.querySelector('.autocomplete-suggestions');
                    
                    // 取消編輯，回到下拉選單
                    event.target.style.display = 'none';
                    dropdown.style.display = 'block';
                    dropdown.value = '';
                    suggestionBox.style.display = 'none';
                }
            });
        });
    },

    /**
     * 設置自動完成功能
     */
    setupAutocomplete(input) {
        const container = input.closest('.subject-dropdown-container');
        const suggestionBox = container.querySelector('.autocomplete-suggestions');
        
        input.addEventListener('input', (event) => {
            const searchTerm = event.target.value;
            
            if (searchTerm.length < 2) {
                suggestionBox.style.display = 'none';
                return;
            }
            
            // 獲取過濾後的建議
            const suggestions = (typeof SubjectCollector !== 'undefined') ? 
                SubjectCollector.getFilteredSubjects(searchTerm) : [];
            
            if (suggestions.length === 0) {
                suggestionBox.style.display = 'none';
                return;
            }
            
            // 生成建議項目
            suggestionBox.innerHTML = suggestions.map(subject => 
                `<div class="suggestion-item px-2 py-1 hover:bg-gray-100 cursor-pointer text-xs" data-value="${subject.replace(/"/g, '&quot;')}">${subject}</div>`
            ).join('');
            
            suggestionBox.style.display = 'block';
            
            // 為建議項目添加點選事件
            suggestionBox.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const selectedValue = e.target.dataset.value;
                    input.value = selectedValue;
                    input.blur(); // 觸發失焦事件保存值
                });
            });
        });
    },

    /**
     * 更新下拉選單新增科目選項
     */
    updateDropdownWithNewSubject(dropdown, newSubject) {
        // 檢查是否已存在
        const existingOptions = Array.from(dropdown.options);
        const exists = existingOptions.some(option => option.value === newSubject);
        
        if (!exists && newSubject) {
            // 在自定義選項之前插入新選項
            const customOption = dropdown.querySelector('option[value="__CUSTOM__"]');
            const newOption = new Option(`✨ ${newSubject}`, newSubject, false, true);
            dropdown.insertBefore(newOption, customOption);
        } else {
            // 選中已存在的選項
            dropdown.value = newSubject;
        }
    },

    /**
     * 保存修改
     */
    saveChanges() {
        try {
            // 記錄變更用於學習系統
            const changes = this.detectChanges();
            
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
            
            // 記錄用戶修改到學習系統
            this.recordUserCorrections(changes);
            
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
     * 檢測用戶所做的變更
     */
    detectChanges() {
        const changes = [];
        
        for (let i = 0; i < this.currentData.length; i++) {
            const current = this.currentData[i];
            const original = this.originalData[i];
            
            const rowChanges = {};
            let hasChanges = false;
            
            // 比較每個欄位
            Object.keys(current).forEach(key => {
                if (current[key] !== original[key]) {
                    rowChanges[key] = {
                        from: original[key],
                        to: current[key]
                    };
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                changes.push({
                    rowIndex: i,
                    previousSubject: current['Subject Name of Previous Studies'],
                    hkitSubject: current['HKIT Subject Code'],
                    changes: rowChanges
                });
            }
        }
        
        return changes;
    },

    /**
     * 記錄用戶修正到學習系統
     */
    async recordUserCorrections(changes) {
        if (!changes.length || typeof StorageManager === 'undefined') return;
        
        try {
            const studentInfo = (typeof StudentInfoManager !== 'undefined') ? 
                StudentInfoManager.getStudentInfo() : {};
            
            // 記錄每個變更
            for (const change of changes) {
                // 如果豁免狀態被修改，記錄為學習數據
                if (change.changes['Exemption Granted']) {
                    await StorageManager.recordExemptionPattern(
                        change.previousSubject,
                        change.hkitSubject,
                        change.changes['Exemption Granted'].to,
                        'user', // 用戶修正具有更高可信度
                        0.9     // 高可信度分數
                    );
                }
                
                // 如果科目名稱被修改，記錄為科目映射
                if (change.changes['Subject Name of Previous Studies']) {
                    // 記錄科目名稱的修正
                    console.log(`📝 用戶修正科目名稱: "${change.changes['Subject Name of Previous Studies'].from}" -> "${change.changes['Subject Name of Previous Studies'].to}"`);
                }
            }
            
            // 記錄完整的用戶決策
            await StorageManager.recordUserDecision({
                changes: changes,
                studentInfo: studentInfo,
                timestamp: new Date().toISOString(),
                totalChanges: changes.length
            });
            
            console.log(`🎯 記錄了 ${changes.length} 個用戶修正到學習系統`);
        } catch (error) {
            console.error('記錄用戶修正失敗:', error);
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