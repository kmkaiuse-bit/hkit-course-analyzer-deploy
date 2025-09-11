/**
 * Debug Monitor Module
 * Provides a floating panel for monitoring storage operations and database contents
 */

const DebugMonitor = {
    panel: null,
    isVisible: false,
    isMinimized: false,
    logCount: 0,
    maxLogs: 100,

    /**
     * Initialize the Debug Monitor
     */
    init() {
        this.createPanel();
        this.setupEventListeners();
        this.addToggleButton();
        this.loadDatabaseStats();
        console.log('✅ DebugMonitor initialized');
    },

    /**
     * Create the debug panel
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'debug-monitor-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 50px;
            left: 20px;
            width: 400px;
            max-height: 600px;
            background: #1a1a1a;
            color: #e0e0e0;
            border: 1px solid #444;
            border-radius: 8px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 9999;
            display: none;
            overflow: hidden;
        `;

        this.panel.innerHTML = `
            <div class="debug-header" style="
                background: #2d2d2d;
                padding: 10px 15px;
                border-bottom: 1px solid #444;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
            ">
                <span>🔍 Storage Debug Monitor</span>
                <div>
                    <button id="debug-minimize-btn" style="
                        background: #555;
                        color: white;
                        border: none;
                        padding: 2px 6px;
                        border-radius: 3px;
                        margin-right: 5px;
                        cursor: pointer;
                    ">−</button>
                    <button id="debug-close-btn" style="
                        background: #d32f2f;
                        color: white;
                        border: none;
                        padding: 2px 6px;
                        border-radius: 3px;
                        cursor: pointer;
                    ">×</button>
                </div>
            </div>
            <div class="debug-content" style="max-height: 550px; overflow-y: auto;">
                <div class="debug-tabs" style="
                    display: flex;
                    background: #2d2d2d;
                    border-bottom: 1px solid #444;
                ">
                    <button class="debug-tab active" data-tab="logs" style="
                        flex: 1;
                        padding: 8px 12px;
                        background: #3d3d3d;
                        color: #e0e0e0;
                        border: none;
                        cursor: pointer;
                        border-right: 1px solid #444;
                    ">Activity Log</button>
                    <button class="debug-tab" data-tab="stats" style="
                        flex: 1;
                        padding: 8px 12px;
                        background: #2d2d2d;
                        color: #e0e0e0;
                        border: none;
                        cursor: pointer;
                        border-right: 1px solid #444;
                    ">Database Stats</button>
                    <button class="debug-tab" data-tab="data" style="
                        flex: 1;
                        padding: 8px 12px;
                        background: #2d2d2d;
                        color: #e0e0e0;
                        border: none;
                        cursor: pointer;
                    ">Stored Data</button>
                </div>
                <div id="debug-logs" class="debug-tab-content" style="padding: 10px; display: block;">
                    <div style="color: #888; font-style: italic; margin-bottom: 10px;">
                        Monitoring storage operations in real-time...
                    </div>
                </div>
                <div id="debug-stats" class="debug-tab-content" style="padding: 10px; display: none;">
                    <div class="stats-loading">Loading database statistics...</div>
                </div>
                <div id="debug-data" class="debug-tab-content" style="padding: 10px; display: none;">
                    <div class="data-loading">Loading stored data...</div>
                </div>
            </div>
        `;

        document.body.appendChild(this.panel);
    },

    /**
     * Add toggle button to the data management section
     */
    addToggleButton() {
        // Add debug toggle to data management section
        const dataManagementSection = document.querySelector('.data-management-section');
        if (dataManagementSection) {
            const debugButtonHTML = `
                <div class="debug-section" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <button class="btn btn-sm" id="debug-monitor-toggle" style="
                        font-size: 0.8rem;
                        padding: 4px 8px;
                        background: #2d3748;
                        color: white;
                        border: 1px solid #4a5568;
                    ">
                        🔍 Debug Monitor
                    </button>
                    <small style="display: block; margin-top: 5px; color: #6c757d;">
                        View real-time storage operations and database contents
                    </small>
                </div>
            `;
            dataManagementSection.insertAdjacentHTML('beforeend', debugButtonHTML);
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle button event listener (will be added after DOM update)
        setTimeout(() => {
            const toggleBtn = document.getElementById('debug-monitor-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggle());
            }
        }, 100);

        // Panel events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'debug-close-btn') {
                this.hide();
            }
            if (e.target.id === 'debug-minimize-btn') {
                this.toggleMinimize();
            }
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('debug-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Make panel draggable
        this.makeDraggable();
    },

    /**
     * Make the panel draggable
     */
    makeDraggable() {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const header = this.panel.querySelector('.debug-header');
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = this.panel.offsetLeft;
            initialTop = this.panel.offsetTop;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            this.panel.style.left = (initialLeft + deltaX) + 'px';
            this.panel.style.top = (initialTop + deltaY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    },

    /**
     * Show the debug panel
     */
    show() {
        this.panel.style.display = 'block';
        this.isVisible = true;
        this.loadDatabaseStats();
    },

    /**
     * Hide the debug panel
     */
    hide() {
        this.panel.style.display = 'none';
        this.isVisible = false;
    },

    /**
     * Toggle the debug panel
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
        const content = this.panel.querySelector('.debug-content');
        const minimizeBtn = this.panel.querySelector('#debug-minimize-btn');
        
        if (this.isMinimized) {
            content.style.display = 'block';
            minimizeBtn.textContent = '−';
            this.panel.style.height = 'auto';
            this.isMinimized = false;
        } else {
            content.style.display = 'none';
            minimizeBtn.textContent = '+';
            this.panel.style.height = 'auto';
            this.isMinimized = true;
        }
    },

    /**
     * Switch tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        this.panel.querySelectorAll('.debug-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
                tab.style.background = '#3d3d3d';
            } else {
                tab.classList.remove('active');
                tab.style.background = '#2d2d2d';
            }
        });

        // Update tab content
        this.panel.querySelectorAll('.debug-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`debug-${tabName}`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }

        // Load content based on tab
        if (tabName === 'stats') {
            this.loadDatabaseStats();
        } else if (tabName === 'data') {
            this.loadStoredData();
        }
    },

    /**
     * Log storage activity
     */
    logActivity(message, type = 'info') {
        const logsContainer = document.getElementById('debug-logs');
        if (!logsContainer) return;

        this.logCount++;
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '#4fc3f7',
            success: '#81c784',
            error: '#f06292',
            warning: '#ffb74d'
        };

        const logEntry = document.createElement('div');
        logEntry.style.cssText = `
            padding: 4px 0;
            border-bottom: 1px solid #333;
            font-size: 11px;
        `;
        logEntry.innerHTML = `
            <span style="color: #888;">[${timestamp}]</span>
            <span style="color: ${colors[type] || colors.info};">${message}</span>
        `;

        logsContainer.appendChild(logEntry);

        // Keep only last 100 logs
        const logs = logsContainer.querySelectorAll('div');
        if (logs.length > this.maxLogs) {
            logs[0].remove();
        }

        // Auto-scroll to bottom
        logsContainer.scrollTop = logsContainer.scrollHeight;
    },

    /**
     * Load database statistics
     */
    async loadDatabaseStats() {
        const statsContainer = document.getElementById('debug-stats');
        if (!statsContainer || typeof StorageManager === 'undefined') return;

        statsContainer.innerHTML = '<div style="color: #888;">Loading statistics...</div>';

        try {
            const stats = await this.getDatabaseStats();
            statsContainer.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <div style="color: #81c784; font-weight: bold; margin-bottom: 8px;">📊 Database Overview</div>
                    <div style="margin-left: 10px;">
                        <div>Exemption Patterns: <span style="color: #4fc3f7;">${stats.exemptionPatterns || 0}</span></div>
                        <div>User Decisions: <span style="color: #4fc3f7;">${stats.userDecisions || 0}</span></div>
                        <div>Subject Mappings: <span style="color: #4fc3f7;">${stats.subjectMappings || 0}</span></div>
                        <div>Settings: <span style="color: #4fc3f7;">${stats.settings || 0}</span></div>
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <div style="color: #81c784; font-weight: bold; margin-bottom: 8px;">🎯 Recent Activity</div>
                    <div style="margin-left: 10px;">
                        <div>Last Analysis: <span style="color: #ffb74d;">${stats.lastAnalysis || 'Never'}</span></div>
                        <div>Last User Edit: <span style="color: #ffb74d;">${stats.lastUserEdit || 'Never'}</span></div>
                        <div>Total Sessions: <span style="color: #4fc3f7;">${stats.totalSessions || 0}</span></div>
                    </div>
                </div>
                <div>
                    <button onclick="DebugMonitor.refreshStats()" style="
                        background: #4fc3f7;
                        color: black;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">🔄 Refresh</button>
                </div>
            `;
        } catch (error) {
            statsContainer.innerHTML = `<div style="color: #f06292;">Error loading stats: ${error.message}</div>`;
        }
    },

    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        if (typeof StorageManager === 'undefined' || !StorageManager.db) {
            return {};
        }

        const stats = {};
        
        try {
            // Get record counts for each store
            for (const storeName of Object.values(StorageManager.stores)) {
                const count = await this.getStoreCount(storeName);
                stats[storeName] = count;
            }

            // Get recent activity from localStorage
            stats.lastAnalysis = localStorage.getItem('last_analysis_time') || 'Never';
            stats.lastUserEdit = localStorage.getItem('last_user_edit_time') || 'Never';
            stats.totalSessions = parseInt(localStorage.getItem('total_sessions') || '0');
        } catch (error) {
            console.error('Error getting database stats:', error);
        }

        return stats;
    },

    /**
     * Get count of records in a store
     */
    getStoreCount(storeName) {
        return new Promise((resolve, reject) => {
            if (!StorageManager.db) {
                resolve(0);
                return;
            }

            const transaction = StorageManager.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const countRequest = store.count();

            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => resolve(0);
        });
    },

    /**
     * Load stored data preview
     */
    async loadStoredData() {
        const dataContainer = document.getElementById('debug-data');
        if (!dataContainer || typeof StorageManager === 'undefined') return;

        dataContainer.innerHTML = '<div style="color: #888;">Loading stored data...</div>';

        try {
            const data = await this.getStoredDataPreview();
            dataContainer.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <button onclick="DebugMonitor.exportAllData()" style="
                        background: #81c784;
                        color: black;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                        margin-right: 5px;
                    ">💾 Export All</button>
                    <button onclick="DebugMonitor.refreshData()" style="
                        background: #4fc3f7;
                        color: black;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">🔄 Refresh</button>
                </div>
                ${data}
            `;
        } catch (error) {
            dataContainer.innerHTML = `<div style="color: #f06292;">Error loading data: ${error.message}</div>`;
        }
    },

    /**
     * Get stored data preview
     */
    async getStoredDataPreview() {
        const preview = [];
        
        for (const [key, storeName] of Object.entries(StorageManager.stores)) {
            const count = await this.getStoreCount(storeName);
            const sampleData = await this.getSampleData(storeName, 3);
            
            preview.push(`
                <div style="margin-bottom: 15px; border: 1px solid #444; border-radius: 4px; padding: 8px;">
                    <div style="color: #81c784; font-weight: bold; margin-bottom: 5px;">
                        📁 ${key} (${count} records)
                    </div>
                    ${sampleData.length > 0 ? 
                        sampleData.map(item => `
                            <div style="margin: 4px 0; padding: 4px; background: #2d2d2d; border-radius: 2px; font-size: 10px;">
                                ${JSON.stringify(item, null, 2).substring(0, 100)}${JSON.stringify(item, null, 2).length > 100 ? '...' : ''}
                            </div>
                        `).join('') :
                        '<div style="color: #888; font-style: italic;">No data</div>'
                    }
                </div>
            `);
        }

        return preview.join('');
    },

    /**
     * Get sample data from a store
     */
    getSampleData(storeName, limit = 3) {
        return new Promise((resolve) => {
            if (!StorageManager.db) {
                resolve([]);
                return;
            }

            const transaction = StorageManager.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result.slice(0, limit);
                resolve(results);
            };
            request.onerror = () => resolve([]);
        });
    },

    /**
     * Refresh statistics
     */
    refreshStats() {
        this.loadDatabaseStats();
        this.logActivity('📊 Database statistics refreshed', 'info');
    },

    /**
     * Refresh data preview
     */
    refreshData() {
        this.loadStoredData();
        this.logActivity('📁 Stored data refreshed', 'info');
    },

    /**
     * Export all data
     */
    async exportAllData() {
        try {
            if (typeof DataManager !== 'undefined' && DataManager.exportLearningData) {
                await DataManager.exportLearningData();
                this.logActivity('💾 All data exported successfully', 'success');
            } else {
                this.logActivity('❌ Export function not available', 'error');
            }
        } catch (error) {
            this.logActivity(`❌ Export failed: ${error.message}`, 'error');
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for other modules to load first
        setTimeout(() => DebugMonitor.init(), 500);
    });
} else {
    setTimeout(() => DebugMonitor.init(), 500);
}

// Make globally available
window.DebugMonitor = DebugMonitor;