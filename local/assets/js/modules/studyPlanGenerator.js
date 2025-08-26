/**
 * 排課計劃生成模組
 * 從 test-ui.html 整合而來，提供智能排課計劃生成功能
 */

const StudyPlanGenerator = {
    // 排課配置
    config: {
        COURSES_PER_GROUP: 4, // 每組課程數量
        TERM_PATTERNS: {
            A: ['A', 'C'], // A 入學：A → C → A → C
            C: ['C', 'A']  // C 入學：C → A → C → A
        }
    },

    /**
     * 初始化排課計劃生成器
     */
    init() {
        this.setupEventListeners();
        console.log('✅ StudyPlanGenerator initialized');
    },

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 排課計劃按鈕
        const generateBtn = document.getElementById('generateStudyPlanBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.showStudyPlanDialog());
        }
    },

    /**
     * 顯示排課計劃對話框
     */
    showStudyPlanDialog() {
        // 獲取當前數據
        const currentData = this.getCurrentData();
        if (!currentData || currentData.length === 0) {
            alert('請先完成課程分析！');
            return;
        }

        // 顯示學期選擇對話框
        const intakeTerm = this.promptForIntakeTerm();
        if (!intakeTerm) return;

        // 生成排課計劃
        this.generateStudyPlan(intakeTerm);
    },

    /**
     * 提示用戶選擇入學學期
     */
    promptForIntakeTerm() {
        const currentYear = new Date().getFullYear();
        const defaultTerm = `T${currentYear}C`;
        
        const intakeTerm = prompt(
            `請輸入入學 Term (例如：T${currentYear}C 或 T${currentYear}A)\n\n` +
            '格式說明：\n' +
            `• T${currentYear}A = ${currentYear}年上學期\n` +
            `• T${currentYear}C = ${currentYear}年下學期`,
            defaultTerm
        );
        
        if (!intakeTerm) return null;
        
        // 驗證格式
        if (!intakeTerm.match(/^T\d{4}[AC]$/)) {
            alert('無效的 Term 格式！請使用 T2025C 或 T2025A 格式');
            return null;
        }
        
        return intakeTerm;
    },

    /**
     * 生成排課計劃主函數
     */
    generateStudyPlan(intakeTerm) {
        try {
            console.log(`🎯 開始為 ${intakeTerm} 入學的學生生成排課計劃...`);
            
            const currentData = this.getCurrentData();
            
            // 按順序分組 (每組指定數量的課程)
            const groups = this.groupCourses(currentData);
            console.log(`📚 總共 ${currentData.length} 科，分為 ${groups.length} 組`);
            
            // 生成 term 序列
            const termSequence = this.generateTermSequence(intakeTerm, groups.length);
            console.log('📅 Term 序列:', termSequence);
            
            // 為每組的非豁免科目安排 study plan
            this.assignStudyPlans(groups, termSequence);
            
            // 更新結果顯示
            this.updateResultsWithStudyPlan();
            
            // 顯示成功訊息
            this.showSuccessMessage(intakeTerm, currentData.length, groups.length);
            
        } catch (error) {
            console.error('排課計劃生成失敗:', error);
            alert('排課計劃生成失敗，請重試');
        }
    },

    /**
     * 將課程分組
     */
    groupCourses(data) {
        const groups = [];
        for (let i = 0; i < data.length; i += this.config.COURSES_PER_GROUP) {
            groups.push(data.slice(i, i + this.config.COURSES_PER_GROUP));
        }
        return groups;
    },

    /**
     * 生成學期序列
     */
    generateTermSequence(intakeTerm, numGroups) {
        const year = parseInt(intakeTerm.substring(1, 5)); // T2025C → 2025
        const termType = intakeTerm.substring(5); // T2025C → C
        
        const terms = [];
        let currentYear = year;
        
        // 根據入學 term 決定循環模式
        const pattern = this.config.TERM_PATTERNS[termType];
        if (!pattern) {
            throw new Error(`不支援的學期類型: ${termType}`);
        }
        
        for (let i = 0; i < numGroups; i++) {
            const currentTerm = pattern[i % 2];
            
            // 年份遞增邏輯：當回到起始 term 時年份 +1
            if (i > 0 && currentTerm === pattern[0]) {
                currentYear++;
            }
            
            terms.push(`T${currentYear}${currentTerm}`);
        }
        
        return terms;
    },

    /**
     * 為課程組分配學習計劃
     */
    assignStudyPlans(groups, termSequence) {
        groups.forEach((group, groupIndex) => {
            const targetTerm = termSequence[groupIndex];
            console.log(`\n📝 第 ${groupIndex + 1} 組 (目標 Term: ${targetTerm}):`);
            
            group.forEach((subject, subjectIndex) => {
                const globalIndex = groupIndex * this.config.COURSES_PER_GROUP + subjectIndex;
                const isExempted = this.isSubjectExempted(subject);
                
                if (!isExempted) {
                    // 更新非豁免科目的 study plan
                    this.updateSubjectStudyPlan(globalIndex, targetTerm);
                    console.log(`  • ${subject['HKIT Subject Code']}: ${subject['HKIT Subject Name']} → ${targetTerm}`);
                } else {
                    // 豁免科目保持 "Exempted"
                    this.updateSubjectStudyPlan(globalIndex, 'Exempted');
                    console.log(`  • ${subject['HKIT Subject Code']}: ${subject['HKIT Subject Name']} → Exempted (已豁免)`);
                }
            });
        });
    },

    /**
     * 判斷科目是否已豁免
     */
    isSubjectExempted(subject) {
        return subject['Exemption Granted'] === true || 
               subject['Exemption Granted'] === 'true' || 
               subject['Exemption Granted'] === 'TRUE';
    },

    /**
     * 更新科目的學習計劃
     */
    updateSubjectStudyPlan(index, studyPlan) {
        // 獲取當前數據
        const currentData = this.getCurrentData();
        if (currentData && currentData[index]) {
            currentData[index]['Exemption Granted / study plan'] = studyPlan;
        }
    },

    /**
     * 更新結果顯示
     */
    updateResultsWithStudyPlan() {
        // 通過 EditModeController 或 ResultsDisplay 更新顯示
        if (typeof EditModeController !== 'undefined' && EditModeController.getCurrentData) {
            const updatedData = EditModeController.getCurrentData();
            if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.updateCurrentResults) {
                ResultsDisplay.updateCurrentResults(updatedData);
            }
        }
    },

    /**
     * 獲取當前數據
     */
    getCurrentData() {
        // 優先從 EditModeController 獲取
        if (typeof EditModeController !== 'undefined' && EditModeController.getCurrentData) {
            return EditModeController.getCurrentData();
        }
        
        // 其次從 ResultsDisplay 獲取
        if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.currentResults) {
            return ResultsDisplay.currentResults;
        }
        
        return null;
    },

    /**
     * 顯示成功訊息
     */
    showSuccessMessage(intakeTerm, totalCourses, totalGroups) {
        const currentData = this.getCurrentData();
        const nonExemptedCount = currentData ? 
            currentData.filter(row => row['Exemption Granted / study plan'] !== 'Exempted').length : 0;
        
        const message = `✅ 排課計劃已生成完成！\n\n` +
                       `📚 課程資訊：\n` +
                       `• 入學 Term: ${intakeTerm}\n` +
                       `• 總課程數: ${totalCourses} 科\n` +
                       `• 需修讀課程: ${nonExemptedCount} 科\n` +
                       `• 預計完成: ${totalGroups} 個學期\n\n` +
                       `🎯 排課計劃已自動更新到表格中！`;
        
        alert(message);
    },

    /**
     * 顯示排課計劃按鈕（當有結果時調用）
     */
    showStudyPlanButton() {
        const generateBtn = document.getElementById('generateStudyPlanBtn');
        if (generateBtn) {
            generateBtn.style.display = 'inline-block';
        }
    },

    /**
     * 隱藏排課計劃按鈕
     */
    hideStudyPlanButton() {
        const generateBtn = document.getElementById('generateStudyPlanBtn');
        if (generateBtn) {
            generateBtn.style.display = 'none';
        }
    },

    /**
     * 獲取排課統計資訊
     */
    getStudyPlanStatistics() {
        const currentData = this.getCurrentData();
        if (!currentData) return null;

        const exemptedCourses = currentData.filter(row => 
            row['Exemption Granted / study plan'] === 'Exempted'
        ).length;

        const termGroups = {};
        currentData.forEach(row => {
            const studyPlan = row['Exemption Granted / study plan'];
            if (studyPlan && studyPlan !== 'Exempted') {
                termGroups[studyPlan] = (termGroups[studyPlan] || 0) + 1;
            }
        });

        return {
            totalCourses: currentData.length,
            exemptedCourses,
            requiredCourses: currentData.length - exemptedCourses,
            termGroups,
            estimatedSemesters: Object.keys(termGroups).length
        };
    },

    /**
     * 重置排課計劃
     */
    resetStudyPlan() {
        const currentData = this.getCurrentData();
        if (!currentData) return;

        currentData.forEach(row => {
            const isExempted = this.isSubjectExempted(row);
            row['Exemption Granted / study plan'] = isExempted ? 'Exempted' : '';
        });

        this.updateResultsWithStudyPlan();
        console.log('🔄 排課計劃已重置');
    }
};

// 全域函數（供 HTML onclick 使用）
window.generateStudyPlan = () => StudyPlanGenerator.showStudyPlanDialog();
window.resetStudyPlan = () => StudyPlanGenerator.resetStudyPlan();