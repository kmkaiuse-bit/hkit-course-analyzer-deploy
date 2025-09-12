/**
 * Storage Manager Module
 * Manages persistent storage using IndexedDB for exemption patterns and historical data
 * Provides learning capabilities for improved accuracy over time
 */

const StorageManager = {
    dbName: 'HKITExemptionDB',
    dbVersion: 1,
    db: null,
    
    // Database schema
    stores: {
        exemptionPatterns: 'exemptionPatterns',
        userDecisions: 'userDecisions',
        subjectMappings: 'subjectMappings',
        settings: 'settings'
    },

    /**
     * Initialize the Storage Manager and IndexedDB
     */
    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('✅ StorageManager initialized with IndexedDB');
            return true;
        } catch (error) {
            console.error('❌ StorageManager initialization failed:', error);
            return false;
        }
    },

    /**
     * Open IndexedDB database
     */
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create exemption patterns store
                if (!db.objectStoreNames.contains(this.stores.exemptionPatterns)) {
                    const exemptionStore = db.createObjectStore(this.stores.exemptionPatterns, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    exemptionStore.createIndex('previousSubject', 'previousSubject', { unique: false });
                    exemptionStore.createIndex('hkitSubject', 'hkitSubject', { unique: false });
                    exemptionStore.createIndex('combo', ['previousSubject', 'hkitSubject'], { unique: false });
                }

                // Create user decisions store
                if (!db.objectStoreNames.contains(this.stores.userDecisions)) {
                    const decisionsStore = db.createObjectStore(this.stores.userDecisions, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    decisionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    decisionsStore.createIndex('studentInfo', 'studentInfo.applicationNumber', { unique: false });
                }

                // Create subject mappings store
                if (!db.objectStoreNames.contains(this.stores.subjectMappings)) {
                    const mappingsStore = db.createObjectStore(this.stores.subjectMappings, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    mappingsStore.createIndex('normalizedName', 'normalizedName', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                }

                console.log('📊 Database schema created/updated');
            };
        });
    },

    /**
     * Record an exemption pattern from API results or user edits
     * @param {string} previousSubject - Previous subject name
     * @param {string} hkitSubject - HKIT subject code
     * @param {boolean} exempted - Whether exemption was granted
     * @param {string} source - Source of the decision ('api' or 'user')
     * @param {number} confidence - Confidence score (0-1)
     */
    async recordExemptionPattern(previousSubject, hkitSubject, exempted, source = 'api', confidence = 0.5) {
        if (!this.db || !previousSubject || !hkitSubject) return;

        try {
            const pattern = {
                previousSubject: previousSubject.trim(),
                hkitSubject: hkitSubject.trim(),
                exempted: exempted,
                source: source,
                confidence: confidence,
                timestamp: new Date().toISOString(),
                count: 1
            };

            // Check if pattern already exists
            const existing = await this.getExemptionPattern(previousSubject, hkitSubject);
            
            if (existing) {
                // Update existing pattern
                existing.count = (existing.count || 1) + 1;
                existing.exempted = exempted; // Update with latest decision
                existing.confidence = this.calculateConfidence(existing);
                existing.lastUpdated = new Date().toISOString();
                
                await this.updateExemptionPattern(existing);
                console.log('📈 Updated exemption pattern:', existing);
                
                // Debug logging
                if (typeof DebugMonitor !== 'undefined') {
                    DebugMonitor.logActivity(`📈 Updated pattern: ${previousSubject} → ${hkitSubject} (count: ${existing.count})`, 'success');
                }
            } else {
                // Create new pattern
                await this.createExemptionPattern(pattern);
                console.log('✨ Created new exemption pattern:', pattern);
                
                // Debug logging
                if (typeof DebugMonitor !== 'undefined') {
                    DebugMonitor.logActivity(`✨ Created pattern: ${previousSubject} → ${hkitSubject} (${exempted ? 'EXEMPT' : 'NOT EXEMPT'})`, 'success');
                }
            }
        } catch (error) {
            console.error('Failed to record exemption pattern:', error);
        }
    },

    /**
     * Get exemption pattern for specific subject combination
     * @param {string} previousSubject - Previous subject name
     * @param {string} hkitSubject - HKIT subject code
     * @returns {Object|null} Exemption pattern or null
     */
    async getExemptionPattern(previousSubject, hkitSubject) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.exemptionPatterns], 'readonly');
            const store = transaction.objectStore(this.stores.exemptionPatterns);
            const index = store.index('combo');
            const request = index.get([previousSubject.trim(), hkitSubject.trim()]);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Create new exemption pattern
     */
    async createExemptionPattern(pattern) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.exemptionPatterns], 'readwrite');
            const store = transaction.objectStore(this.stores.exemptionPatterns);
            const request = store.add(pattern);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Update existing exemption pattern
     */
    async updateExemptionPattern(pattern) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.exemptionPatterns], 'readwrite');
            const store = transaction.objectStore(this.stores.exemptionPatterns);
            const request = store.put(pattern);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Calculate confidence score based on historical data
     * @param {Object} pattern - Exemption pattern
     * @returns {number} Confidence score (0-1)
     */
    calculateConfidence(pattern) {
        const baseConfidence = 0.5;
        const countBonus = Math.min(pattern.count * 0.1, 0.4); // Max 0.4 bonus for frequency
        const sourceBonus = pattern.source === 'user' ? 0.1 : 0; // User corrections get higher confidence
        
        return Math.min(baseConfidence + countBonus + sourceBonus, 1.0);
    },

    /**
     * Get exemption suggestions for a previous subject
     * @param {string} previousSubject - Previous subject name
     * @returns {Array} Array of suggestions with confidence scores
     */
    async getExemptionSuggestions(previousSubject) {
        if (!this.db || !previousSubject) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.exemptionPatterns], 'readonly');
            const store = transaction.objectStore(this.stores.exemptionPatterns);
            const index = store.index('previousSubject');
            const request = index.getAll(previousSubject.trim());

            request.onsuccess = () => {
                const patterns = request.result || [];
                const suggestions = patterns
                    .filter(p => p.exempted && p.confidence > 0.3)
                    .sort((a, b) => b.confidence - a.confidence)
                    .map(p => ({
                        hkitSubject: p.hkitSubject,
                        confidence: p.confidence,
                        count: p.count,
                        lastUpdated: p.lastUpdated
                    }));
                
                resolve(suggestions);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Record user decision for learning
     * @param {Object} decisionData - User decision data
     */
    async recordUserDecision(decisionData) {
        if (!this.db) return;

        try {
            const decision = {
                ...decisionData,
                timestamp: new Date().toISOString(),
                type: 'user_edit'
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.stores.userDecisions], 'readwrite');
                const store = transaction.objectStore(this.stores.userDecisions);
                const request = store.add(decision);

                request.onsuccess = () => {
                    console.log('📝 Recorded user decision:', decision);
                    
                    // Debug logging
                    if (typeof DebugMonitor !== 'undefined') {
                        const changeCount = decision.totalChanges || decision.changes?.length || 0;
                        DebugMonitor.logActivity(`📝 Recorded user decision with ${changeCount} changes`, 'info');
                    }
                    
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to record user decision:', error);
        }
    },

    /**
     * Batch record exemption patterns from analysis results
     * @param {Array} results - Analysis results
     * @param {Object} studentInfo - Student information
     */
    async recordAnalysisResults(results, studentInfo = {}) {
        if (!Array.isArray(results)) return;

        // Use learning client if available (PostgreSQL), otherwise fallback to local storage
        if (typeof window !== 'undefined' && window.learningClient) {
            try {
                await window.learningClient.recordAnalysisResults(results, studentInfo);
                console.log('✅ Saved analysis results to PostgreSQL learning database');
                return;
            } catch (error) {
                console.warn('Learning client failed, falling back to local storage:', error);
            }
        }

        // Fallback to local IndexedDB storage
        const recordPromises = results.map(result => {
            const previousSubject = result['Subject Name of Previous Studies'];
            const hkitSubject = result['HKIT Subject Code'];
            const exempted = result['Exemption Granted'] === 'TRUE';

            if (previousSubject && hkitSubject) {
                return this.recordExemptionPattern(
                    previousSubject, 
                    hkitSubject, 
                    exempted, 
                    'api', 
                    0.6 // API results get moderate confidence
                );
            }
        }).filter(Boolean);

        await Promise.all(recordPromises);

        // Debug logging
        if (typeof DebugMonitor !== 'undefined') {
            const exemptionCount = results.filter(r => r['Exemption Granted'] === 'TRUE').length;
            DebugMonitor.logActivity(`📊 Recorded ${results.length} analysis results (${exemptionCount} exemptions)`, 'success');
        }

        // Record the complete decision set
        await this.recordUserDecision({
            results: results,
            studentInfo: studentInfo,
            source: 'api_analysis'
        });

        console.log(`📊 Recorded ${recordPromises.length} exemption patterns from analysis`);
    },

    /**
     * Get database statistics
     * @returns {Object} Database statistics
     */
    async getStatistics() {
        if (!this.db) return {};

        try {
            const stats = {};
            
            for (const storeName of Object.values(this.stores)) {
                const count = await this.getStoreCount(storeName);
                stats[storeName] = count;
            }

            const recentPatterns = await this.getRecentPatterns(30); // Last 30 days
            stats.recentActivity = recentPatterns.length;

            return stats;
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return {};
        }
    },

    /**
     * Get count of records in a store
     */
    async getStoreCount(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get recent exemption patterns
     */
    async getRecentPatterns(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.exemptionPatterns], 'readonly');
            const store = transaction.objectStore(this.stores.exemptionPatterns);
            const request = store.getAll();

            request.onsuccess = () => {
                const patterns = request.result || [];
                const recent = patterns.filter(p => 
                    new Date(p.timestamp) > cutoffDate
                );
                resolve(recent);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Export all data to JSON
     * @returns {Object} Exported data
     */
    async exportData() {
        if (!this.db) return {};

        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                data: {}
            };

            for (const storeName of Object.values(this.stores)) {
                exportData.data[storeName] = await this.getAllFromStore(storeName);
            }

            return exportData;
        } catch (error) {
            console.error('Failed to export data:', error);
            return {};
        }
    },

    /**
     * Get all records from a store
     */
    async getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Import data from JSON
     * @param {Object} importData - Data to import
     * @returns {boolean} Success status
     */
    async importData(importData) {
        if (!this.db || !importData.data) return false;

        try {
            for (const [storeName, records] of Object.entries(importData.data)) {
                if (Object.values(this.stores).includes(storeName) && Array.isArray(records)) {
                    await this.importToStore(storeName, records);
                }
            }

            console.log('✅ Successfully imported data');
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    },

    /**
     * Import records to specific store
     */
    async importToStore(storeName, records) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            let completed = 0;
            const total = records.length;

            if (total === 0) {
                resolve();
                return;
            }

            records.forEach(record => {
                // Remove id for auto-increment stores
                const cleanRecord = { ...record };
                delete cleanRecord.id;

                const request = store.add(cleanRecord);
                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                request.onerror = (event) => {
                    // Continue on errors (might be duplicates)
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
            });
        });
    },

    /**
     * Clear all data
     */
    async clearAllData() {
        if (!this.db) return false;

        try {
            for (const storeName of Object.values(this.stores)) {
                await this.clearStore(storeName);
            }
            console.log('🗑️ All data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    },

    /**
     * Clear specific store
     */
    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StorageManager.init());
} else {
    StorageManager.init();
}