/**
 * 學生資訊管理模組
 * 從 test-ui.html 整合而來
 */

const StudentInfoManager = {
    // 學生資訊物件
    studentInfo: {
        name: '',
        applicationNumber: '',
        appliedProgramme: ''
    },

    /**
     * 載入課程選項（與主系統保持一致）
     */
    loadProgrammeOptions() {
        const appliedProgrammeSelect = document.getElementById('appliedProgramme');
        if (!appliedProgrammeSelect || typeof TemplateManager === 'undefined') return;

        const options = TemplateManager.getProgrammeOptions();
        
        // 清除現有選項（保留預設選項）
        appliedProgrammeSelect.innerHTML = '<option value="">請選擇申請課程</option>';
        
        // 添加課程選項
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.fullName || option.label;
            appliedProgrammeSelect.appendChild(optionElement);
        });
        
        console.log('✅ 學生資訊課程選項已載入');
    },

    /**
     * 設置課程選擇同步（主系統 programmeType 與學生資訊 appliedProgramme）
     */
    setupProgrammeSync() {
        const mainProgrammeSelect = document.getElementById('programmeType');
        const studentProgrammeSelect = document.getElementById('appliedProgramme');
        
        if (!mainProgrammeSelect || !studentProgrammeSelect) return;
        
        // 當主系統課程選擇變更時，同步到學生資訊
        mainProgrammeSelect.addEventListener('change', () => {
            const selectedValue = mainProgrammeSelect.value;
            if (selectedValue && studentProgrammeSelect.value !== selectedValue) {
                studentProgrammeSelect.value = selectedValue;
                console.log(`🔄 課程選擇已同步: ${selectedValue}`);
                
                // 觸發驗證
                this.validateStudentInfo();
            }
        });
        
        // 當學生資訊課程選擇變更時，同步到主系統（可選）
        studentProgrammeSelect.addEventListener('change', () => {
            const selectedValue = studentProgrammeSelect.value;
            if (selectedValue && mainProgrammeSelect.value !== selectedValue) {
                mainProgrammeSelect.value = selectedValue;
                console.log(`🔄 主系統課程選擇已同步: ${selectedValue}`);
            }
        });
        
        console.log('✅ 課程選擇同步已設置');
    },

    /**
     * 自動同步當前選中的課程（當顯示學生資訊輸入時呼叫）
     */
    syncCurrentProgramme() {
        const mainProgrammeSelect = document.getElementById('programmeType');
        const studentProgrammeSelect = document.getElementById('appliedProgramme');
        
        if (mainProgrammeSelect && studentProgrammeSelect && mainProgrammeSelect.value) {
            studentProgrammeSelect.value = mainProgrammeSelect.value;
            console.log(`🔄 已同步當前課程: ${mainProgrammeSelect.value}`);
        }
    },

    /**
     * 初始化學生資訊管理
     */
    init() {
        this.setupEventListeners();
        this.loadProgrammeOptions(); // 載入課程選項
        this.setupProgrammeSync(); // 設置課程同步
        console.log('✅ StudentInfoManager initialized');
    },

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 驗證學生資訊
        const studentName = document.getElementById('studentName');
        const applicationNumber = document.getElementById('applicationNumber');
        const appliedProgramme = document.getElementById('appliedProgramme');
        
        if (studentName) studentName.addEventListener('input', () => this.validateStudentInfo());
        if (applicationNumber) applicationNumber.addEventListener('input', () => this.validateStudentInfo());
        if (appliedProgramme) appliedProgramme.addEventListener('change', () => this.validateStudentInfo());
        
        // 保存學生資訊按鈕
        const saveBtn = document.getElementById('saveStudentInfoBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveStudentInfo());
        }
        
        // 編輯學生資訊按鈕
        const editBtn = document.getElementById('editStudentInfoBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editStudentInfo());
        }
    },

    /**
     * 驗證學生資訊
     */
    validateStudentInfo() {
        const name = document.getElementById('studentName')?.value.trim() || '';
        const appNum = document.getElementById('applicationNumber')?.value.trim() || '';
        const programme = document.getElementById('appliedProgramme')?.value || '';
        
        const isValid = name && appNum && programme;
        const statusDiv = document.getElementById('validationStatus');
        const icon = document.getElementById('validationIcon');
        const text = document.getElementById('validationText');
        const saveBtn = document.getElementById('saveStudentInfoBtn');
        
        if (!statusDiv) return isValid;
        
        if (isValid) {
            statusDiv.classList.remove('hidden');
            statusDiv.className = 'mt-4 p-3 bg-green-50 border border-green-200 rounded-lg';
            if (icon) icon.className = 'w-4 h-4 text-green-600';
            if (text) {
                text.className = 'text-green-800';
                text.textContent = '✓ 學生資訊已完整填寫';
            }
            if (saveBtn) saveBtn.disabled = false;
        } else {
            statusDiv.classList.remove('hidden');
            statusDiv.className = 'mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
            if (icon) icon.className = 'w-4 h-4 text-yellow-600';
            if (text) {
                text.className = 'text-yellow-800';
                text.textContent = '⚠ 請完整填寫所有必填欄位';
            }
            if (saveBtn) saveBtn.disabled = true;
        }
        
        return isValid;
    },

    /**
     * 保存學生資訊
     */
    saveStudentInfo() {
        if (!this.validateStudentInfo()) {
            return false;
        }
        
        this.studentInfo.name = document.getElementById('studentName')?.value.trim() || '';
        this.studentInfo.applicationNumber = document.getElementById('applicationNumber')?.value.trim() || '';
        this.studentInfo.appliedProgramme = document.getElementById('appliedProgramme')?.value || '';
        
        // 更新顯示卡片
        this.updateStudentInfoDisplay();
        
        // 隱藏輸入卡片，顯示資訊卡片
        const inputCard = document.getElementById('studentInfoCard');
        const displayCard = document.getElementById('studentInfoDisplay');
        
        if (inputCard) inputCard.style.display = 'none';
        if (displayCard) displayCard.style.display = 'block';
        
        // 顯示成功訊息
        this.showSuccessMessage();
        
        console.log('✅ 學生資訊已保存:', this.studentInfo);
        return true;
    },

    /**
     * 更新學生資訊顯示
     */
    updateStudentInfoDisplay() {
        const nameDisplay = document.getElementById('displayStudentName');
        const numberDisplay = document.getElementById('displayApplicationNumber');
        const programmeDisplay = document.getElementById('displayAppliedProgramme');
        
        if (nameDisplay) nameDisplay.textContent = this.studentInfo.name;
        if (numberDisplay) numberDisplay.textContent = `申請編號: ${this.studentInfo.applicationNumber}`;
        if (programmeDisplay) programmeDisplay.textContent = this.studentInfo.appliedProgramme;
    },

    /**
     * 編輯學生資訊
     */
    editStudentInfo() {
        // 填入現有資訊
        const studentName = document.getElementById('studentName');
        const applicationNumber = document.getElementById('applicationNumber');
        const appliedProgramme = document.getElementById('appliedProgramme');
        
        if (studentName) studentName.value = this.studentInfo.name;
        if (applicationNumber) applicationNumber.value = this.studentInfo.applicationNumber;
        if (appliedProgramme) appliedProgramme.value = this.studentInfo.appliedProgramme;
        
        // 顯示輸入卡片，隱藏顯示卡片
        const inputCard = document.getElementById('studentInfoCard');
        const displayCard = document.getElementById('studentInfoDisplay');
        
        if (inputCard) inputCard.style.display = 'block';
        if (displayCard) displayCard.style.display = 'none';
        
        // 驗證狀態
        this.validateStudentInfo();
    },

    /**
     * 顯示成功訊息
     */
    showSuccessMessage() {
        const btn = document.getElementById('saveStudentInfoBtn');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>已保存';
        btn.classList.add('bg-green-600');
        btn.classList.remove('bg-blue-600');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('bg-green-600');
            btn.classList.add('bg-blue-600');
        }, 2000);
    },

    /**
     * 顯示學生資訊輸入介面
     */
    showStudentInfoInput() {
        const inputCard = document.getElementById('studentInfoCard');
        if (inputCard) {
            inputCard.style.display = 'block';
            
            // 首先同步當前選中的課程
            this.syncCurrentProgramme();
            
            // 預填一些測試資料（可選）
            const studentName = document.getElementById('studentName');
            const applicationNumber = document.getElementById('applicationNumber');
            
            if (studentName && !studentName.value) studentName.value = 'Steven Kok';
            if (applicationNumber && !applicationNumber.value) applicationNumber.value = 'APP2024001';
            
            // 驗證狀態
            this.validateStudentInfo();
        }
    },

    /**
     * 獲取學生資訊 (供其他模組使用)
     */
    getStudentInfo() {
        return { ...this.studentInfo };
    },

    /**
     * 重置學生資訊
     */
    resetStudentInfo() {
        this.studentInfo = {
            name: '',
            applicationNumber: '',
            appliedProgramme: ''
        };
        
        // 清空表單
        const fields = ['studentName', 'applicationNumber', 'appliedProgramme'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
        
        // 隱藏顯示卡片
        const displayCard = document.getElementById('studentInfoDisplay');
        if (displayCard) displayCard.style.display = 'none';
        
        console.log('🔄 學生資訊已重置');
    },

    /**
     * Clear student info (alias for resetStudentInfo)
     */
    clearStudentInfo() {
        this.resetStudentInfo();
    }
};

// 全域函數 (供 HTML onclick 使用)
window.showStudentInfoInput = () => StudentInfoManager.showStudentInfoInput();
window.saveStudentInfo = () => StudentInfoManager.saveStudentInfo();
window.editStudentInfo = () => StudentInfoManager.editStudentInfo();