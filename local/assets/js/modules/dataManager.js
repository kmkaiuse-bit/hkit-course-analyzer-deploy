/**
 * Data Manager Module
 * Handles import/export functionality for database backup and sharing
 * Provides UI controls for data management
 */

const DataManager = {
    /**
     * Initialize the Data Manager
     */
    init() {
        this.addDataManagementUI();
        this.setupEventListeners();
        console.log('✅ DataManager initialized');
    },

    /**
     * Add data management UI to the settings section
     */
    addDataManagementUI() {
        const settingsCard = document.getElementById('settings-card');
        if (settingsCard) {
            const settingsContainer = settingsCard;
            
            // Create data management section
            const dataManagementHTML = `
                <div class="data-management-section" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <h4 style="color: #4a5568; margin-bottom: 10px;">📊 數據管理</h4>
                    
                    <!-- Database Statistics -->
                    <div id="dbStats" class="db-stats" style="background: #f7fafc; padding: 10px; border-radius: 6px; margin-bottom: 10px; font-size: 0.8rem;">
                        <div class="stats-loading">正在載入統計資料...</div>
                    </div>
                    
                    <!-- Export Section -->
                    <div class="export-section" style="margin-bottom: 10px;">
                        <label style="font-weight: 600; font-size: 0.9rem; color: #2d3748;">匯出數據:</label>
                        <div style="margin-top: 5px;">
                            <button class="btn btn-sm" id="exportDataBtn" style="font-size: 0.8rem; padding: 4px 8px;">
                                📤 匯出學習數據
                            </button>
                            <button class="btn btn-sm" id="exportSubjectsBtn" style="font-size: 0.8rem; padding: 4px 8px; margin-left: 5px;">
                                📝 匯出科目清單
                            </button>
                        </div>
                    </div>
                    
                    <!-- Import Section -->
                    <div class="import-section" style="margin-bottom: 10px;">
                        <label style="font-weight: 600; font-size: 0.9rem; color: #2d3748;">匯入數據:</label>
                        <div style="margin-top: 5px;">
                            <input type="file" id="importFileInput" accept=".json" style="display: none;">
                            <button class="btn btn-sm" id="importDataBtn" style="font-size: 0.8rem; padding: 4px 8px;">
                                📥 匯入學習數據
                            </button>
                            <button class="btn btn-sm" id="importSubjectsBtn" style="font-size: 0.8rem; padding: 4px 8px; margin-left: 5px;">
                                📚 匯入科目清單
                            </button>
                        </div>
                    </div>
                    
                    <!-- Management Actions -->
                    <div class="management-actions" style="margin-top: 10px;">
                        <button class="btn btn-sm" id="clearCacheBtn" style="font-size: 0.8rem; padding: 4px 8px; background: #fef5e7; color: #f39c12;">
                            🔄 清理快取
                        </button>
                        <button class="btn btn-sm" id="clearSubjectsBtn" style="font-size: 0.8rem; padding: 4px 8px; margin-left: 5px; background: #fed7d7; color: #c53030;">
                            🗑️ 清空科目
                        </button>
                        <button class="btn btn-sm" id="clearDbBtn" style="font-size: 0.8rem; padding: 4px 8px; margin-left: 5px; background: #fed7d7; color: #c53030;">
                            🗑️ 清空數據庫
                        </button>
                    </div>
                    
                    <!-- Debug Tools -->
                    <div class="debug-tools" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                        <button class="btn btn-sm" id="debugMonitorBtn" style="font-size: 0.8rem; padding: 4px 8px; background: #e2e8f0; color: #4a5568;">
                            🔍 Debug Monitor
                        </button>
                        <button class="btn btn-sm" id="cacheInfoBtn" style="font-size: 0.8rem; padding: 4px 8px; margin-left: 5px; background: #e2e8f0; color: #4a5568;">
                            ℹ️ Cache Info
                        </button>
                    </div>
                </div>
            `;
            
            settingsContainer.insertAdjacentHTML('beforeend', dataManagementHTML);
            
            // Update database statistics
            this.updateDatabaseStats();
        }
    },

    /**
     * Setup event listeners for data management
     */
    setupEventListeners() {
        // Export buttons
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportLearningData());
        document.getElementById('exportSubjectsBtn')?.addEventListener('click', () => this.exportSubjects());
        
        // Import buttons
        document.getElementById('importDataBtn')?.addEventListener('click', () => this.triggerImport('learning'));
        document.getElementById('importSubjectsBtn')?.addEventListener('click', () => this.triggerImport('subjects'));
        
        // Clear buttons
        document.getElementById('clearCacheBtn')?.addEventListener('click', () => this.clearCache());
        document.getElementById('clearSubjectsBtn')?.addEventListener('click', () => this.clearSubjects());
        document.getElementById('clearDbBtn')?.addEventListener('click', () => this.clearDatabase());
        
        // Debug buttons
        document.getElementById('debugMonitorBtn')?.addEventListener('click', () => this.openDebugMonitor());
        document.getElementById('cacheInfoBtn')?.addEventListener('click', () => this.showCacheInfo());
        
        // File input change
        document.getElementById('importFileInput')?.addEventListener('change', (e) => this.handleFileImport(e));
    },

    /**
     * Update database statistics display
     */
    async updateDatabaseStats() {
        const statsContainer = document.getElementById('dbStats');
        if (!statsContainer) return;

        try {
            const [storageStats, subjectStats] = await Promise.all([
                (typeof StorageManager !== 'undefined') ? StorageManager.getStatistics() : {},
                (typeof SubjectCollector !== 'undefined') ? SubjectCollector.getStatistics() : {}
            ]);

            const statsHTML = `
                <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.75rem;">
                    <div>
                        <strong>豁免模式:</strong> ${storageStats.exemptionPatterns || 0}
                        <br><strong>用戶決策:</strong> ${storageStats.userDecisions || 0}
                    </div>
                    <div>
                        <strong>收集科目:</strong> ${subjectStats.totalSubjects || 0}
                        <br><strong>近期活動:</strong> ${storageStats.recentActivity || 0}
                    </div>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 0.7rem; color: #718096;">
                    最後更新: ${new Date().toLocaleString()}
                </div>
            `;
            
            statsContainer.innerHTML = statsHTML;
        } catch (error) {
            statsContainer.innerHTML = '<div style="color: #e53e3e; font-size: 0.75rem;">無法載入統計資料</div>';
            console.error('Failed to update database stats:', error);
        }
    },

    /**
     * Export learning data
     */
    async exportLearningData() {
        try {
            if (typeof StorageManager === 'undefined') {
                throw new Error('StorageManager not available');
            }

            const data = await StorageManager.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hkit-learning-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.showSuccessMessage('學習數據已匯出');
            console.log('✅ Learning data exported successfully');
        } catch (error) {
            this.showErrorMessage('匯出學習數據失敗: ' + error.message);
            console.error('Export learning data failed:', error);
        }
    },

    /**
     * Export subjects list
     */
    async exportSubjects() {
        try {
            if (typeof SubjectCollector === 'undefined') {
                throw new Error('SubjectCollector not available');
            }

            const subjectsData = SubjectCollector.exportToJSON();
            const blob = new Blob([subjectsData], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hkit-subjects-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.showSuccessMessage('科目清單已匯出');
            console.log('✅ Subjects exported successfully');
        } catch (error) {
            this.showErrorMessage('匯出科目清單失敗: ' + error.message);
            console.error('Export subjects failed:', error);
        }
    },

    /**
     * Trigger file import
     */
    triggerImport(type) {
        const fileInput = document.getElementById('importFileInput');
        if (fileInput) {
            fileInput.dataset.importType = type;
            fileInput.click();
        }
    },

    /**
     * Handle file import
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        const importType = event.target.dataset.importType;
        
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            let success = false;
            let message = '';
            
            if (importType === 'learning') {
                if (typeof StorageManager !== 'undefined') {
                    success = await StorageManager.importData(data);
                    message = success ? '學習數據匯入成功' : '學習數據匯入失敗';
                }
            } else if (importType === 'subjects') {
                if (typeof SubjectCollector !== 'undefined') {
                    success = SubjectCollector.importFromJSON(JSON.stringify(data));
                    message = success ? '科目清單匯入成功' : '科目清單匯入失敗';
                }
            }
            
            if (success) {
                this.showSuccessMessage(message);
                this.updateDatabaseStats();
            } else {
                this.showErrorMessage(message);
            }
            
        } catch (error) {
            this.showErrorMessage('匯入失敗: ' + error.message);
            console.error('Import failed:', error);
        }
        
        // Reset file input
        event.target.value = '';
    },

    /**
     * Clear cache (fixes dropdown preset issue)
     */
    async clearCache() {
        if (!confirm('確定要清理快取嗎？\n\n這將清除下拉選單中的預設科目，解決科目顯示問題。')) {
            return;
        }

        try {
            if (typeof SubjectCollector !== 'undefined') {
                SubjectCollector.clearCache();
                this.showSuccessMessage('快取已清理！下拉選單已重置。');
                this.updateDatabaseStats();
            } else {
                // Fallback: directly clear localStorage
                localStorage.removeItem('hkit_collected_subjects');
                ['commonSubjects', 'hkit_subjects', 'collected_subjects'].forEach(key => {
                    localStorage.removeItem(key);
                });
                this.showSuccessMessage('快取已清理！請重新載入頁面。');
            }
        } catch (error) {
            this.showErrorMessage('清理快取失敗: ' + error.message);
            console.error('Clear cache failed:', error);
        }
    },

    /**
     * Clear subjects
     */
    async clearSubjects() {
        if (!confirm('確定要清空所有收集的科目嗎？這個操作無法復原。')) {
            return;
        }

        try {
            if (typeof SubjectCollector !== 'undefined') {
                SubjectCollector.clearAllSubjects();
                this.showSuccessMessage('科目清單已清空');
                this.updateDatabaseStats();
            }
        } catch (error) {
            this.showErrorMessage('清空科目失敗: ' + error.message);
            console.error('Clear subjects failed:', error);
        }
    },

    /**
     * Clear entire database
     */
    async clearDatabase() {
        if (!confirm('⚠️ 確定要清空整個數據庫嗎？\n\n這將刪除所有學習數據、用戶決策和豁免模式。\n此操作無法復原！')) {
            return;
        }

        if (!confirm('最後確認：這將永久刪除所有數據，您確定要繼續嗎？')) {
            return;
        }

        try {
            const promises = [];
            
            if (typeof StorageManager !== 'undefined') {
                promises.push(StorageManager.clearAllData());
            }
            
            if (typeof SubjectCollector !== 'undefined') {
                SubjectCollector.clearAllSubjects();
            }
            
            await Promise.all(promises);
            
            this.showSuccessMessage('數據庫已清空');
            this.updateDatabaseStats();
            console.log('🗑️ Database cleared');
        } catch (error) {
            this.showErrorMessage('清空數據庫失敗: ' + error.message);
            console.error('Clear database failed:', error);
        }
    },

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    },

    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    },

    /**
     * Open debug monitor
     */
    openDebugMonitor() {
        if (typeof DebugMonitor !== 'undefined') {
            DebugMonitor.togglePanel();
        } else {
            this.showErrorMessage('Debug Monitor 模組未載入');
        }
    },

    /**
     * Show cache information
     */
    showCacheInfo() {
        try {
            let cacheInfo = 'Cache Information:\n\n';
            
            if (typeof SubjectCollector !== 'undefined') {
                const info = SubjectCollector.getCacheInfo();
                cacheInfo += `Subjects Cache:\n`;
                cacheInfo += `- Cache exists: ${info.cacheExists}\n`;
                cacheInfo += `- Subject count: ${info.subjectCount}\n`;
                cacheInfo += `- Last updated: ${info.lastUpdated || 'Never'}\n`;
                cacheInfo += `- Cache size: ${info.cacheSize} bytes\n\n`;
            }
            
            // Check other localStorage keys
            const allKeys = Object.keys(localStorage);
            const hkitKeys = allKeys.filter(key => key.includes('hkit') || key.includes('gemini'));
            
            cacheInfo += `localStorage Keys (${hkitKeys.length}):\n`;
            hkitKeys.forEach(key => {
                const value = localStorage.getItem(key);
                const size = value ? value.length : 0;
                cacheInfo += `- ${key}: ${size} bytes\n`;
            });
            
            // Show in alert (could be enhanced with a modal)
            alert(cacheInfo);
            
        } catch (error) {
            this.showErrorMessage('無法讀取快取資訊: ' + error.message);
            console.error('Cache info failed:', error);
        }
    },

    /**
     * Show temporary message
     */
    showMessage(message, type = 'info') {
        // Try to use NotificationManager if available
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.show(message, type);
            return;
        }
        
        // Fallback to simple message display
        const messageElement = document.createElement('div');
        messageElement.className = `data-manager-message ${type}`;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            ${type === 'success' ? 'background: #48bb78; color: white;' : ''}
            ${type === 'error' ? 'background: #f56565; color: white;' : ''}
            ${type === 'info' ? 'background: #4299e1; color: white;' : ''}
        `;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);
    }
};

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DataManager.init());
} else {
    DataManager.init();
}