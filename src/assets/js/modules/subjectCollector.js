/**
 * Subject Collector Module
 * Manages the collection and storage of extracted subject names from API responses
 * Provides autocomplete functionality for the Subject Name dropdown
 */

const SubjectCollector = {
    // In-memory storage for the current session
    extractedSubjects: new Set(),

    /**
     * Initialize the Subject Collector
     */
    init() {
        this.loadFromStorage();
        console.log('✅ SubjectCollector initialized with', this.extractedSubjects.size, 'subjects');
    },

    /**
     * Extract ALL subjects directly from transcript text
     * @param {string} transcriptText - Raw transcript content
     */
    extractFromTranscript(transcriptText) {
        if (!transcriptText || typeof transcriptText !== 'string') return;

        let newSubjectsCount = 0;
        const beforeCount = this.extractedSubjects.size;

        // Comprehensive patterns to match various transcript formats
        const patterns = [
            // Standard course format: "Course Name" followed by code/grade
            /^([A-Z][^:\n\r]{10,80})(?=\s*[:\-\(\[A-Z0-9])/gm,
            
            // Format: "Subject: Course Name"
            /(?:Subject|Course|Module)[\s:]+([A-Z][^:\n\r]{5,60})/gi,
            
            // Format with course codes: "ABC123 - Course Name"
            /[A-Z]{2,4}\d{3,4}[\s\-:]*([A-Z][^:\n\r]{10,60})/gi,
            
            // Lines starting with capital letter (potential course names)
            /^([A-Z][A-Za-z\s&\-:]{15,80})(?=\s*(?:\d+|\n|$))/gm,
            
            // Format: "1. Course Name" or "• Course Name"
            /^[\s]*(?:\d+\.|\•|\-)\s*([A-Z][^:\n\r]{10,70})/gm,
            
            // Format in tables: words separated by tabs/spaces with grades
            /^([A-Z][A-Za-z\s&\-:]{10,60})(?=\s+[A-F\+\-]?\s*\d)/gm
        ];

        patterns.forEach((pattern, index) => {
            const matches = transcriptText.matchAll(pattern);
            let patternCount = 0;
            
            for (const match of matches) {
                let subjectName = match[1];
                if (subjectName) {
                    // Clean and validate the subject name
                    const cleanSubject = this.cleanSubjectName(subjectName);
                    if (this.isValidSubjectName(cleanSubject)) {
                        if (!this.extractedSubjects.has(cleanSubject)) {
                            this.extractedSubjects.add(cleanSubject);
                            newSubjectsCount++;
                            patternCount++;
                        }
                    }
                }
            }
            
            console.log(`📝 Pattern ${index + 1} extracted ${patternCount} subjects`);
        });

        if (newSubjectsCount > 0) {
            this.saveToStorage();
            console.log(`🔍 Direct transcript parsing: +${newSubjectsCount} subjects (${beforeCount} → ${this.extractedSubjects.size})`);
        }

        return newSubjectsCount;
    },

    /**
     * Validate if extracted text is likely a valid subject name
     * @param {string} subjectName - Subject name to validate
     * @returns {boolean} True if valid
     */
    isValidSubjectName(subjectName) {
        if (!subjectName || subjectName.length < 8) return false;
        
        // Reject common false positives
        const blacklist = [
            'Student Name', 'Student Number', 'Date of Birth', 'Programme',
            'Academic Year', 'Semester', 'Grade Point', 'Credits', 'Total',
            'Transcript', 'Certificate', 'Diploma', 'University', 'College',
            'Department', 'Faculty', 'School', 'Institution', 'Address',
            'Phone', 'Email', 'Website', 'Page', 'Continued', 'End of'
        ];
        
        if (blacklist.some(item => subjectName.includes(item))) return false;
        
        // Must contain at least one alphabetic word longer than 2 characters
        const hasValidWord = /\b[A-Za-z]{3,}\b/.test(subjectName);
        
        // Should not be mostly numbers or symbols
        const alphaRatio = (subjectName.match(/[A-Za-z]/g) || []).length / subjectName.length;
        
        return hasValidWord && alphaRatio > 0.5;
    },

    /**
     * Extract and collect subjects from analysis results
     * @param {Array} results - Analysis results from Gemini API
     */
    collectFromResults(results) {
        if (!Array.isArray(results)) return;

        let newSubjectsCount = 0;
        
        results.forEach(result => {
            const subjectName = result['Subject Name of Previous Studies'];
            if (subjectName && subjectName.trim() && subjectName !== '') {
                const cleanSubject = this.cleanSubjectName(subjectName);
                if (cleanSubject && !this.extractedSubjects.has(cleanSubject)) {
                    this.extractedSubjects.add(cleanSubject);
                    newSubjectsCount++;
                }
            }
        });

        if (newSubjectsCount > 0) {
            this.saveToStorage();
            console.log(`📚 Collected ${newSubjectsCount} new subjects from API results. Total: ${this.extractedSubjects.size}`);
        }
    },

    /**
     * Clean and normalize subject name
     * @param {string} subjectName - Raw subject name
     * @returns {string} Cleaned subject name
     */
    cleanSubjectName(subjectName) {
        if (!subjectName) return '';
        
        return subjectName
            .trim()
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/[""'']/g, '"')  // Normalize quotes
            .replace(/\.$/, '');  // Remove trailing period
    },

    /**
     * Get all available subjects for dropdown
     * @returns {Array} Sorted array of subject names
     */
    getAllSubjects() {
        return Array.from(this.extractedSubjects).sort((a, b) => a.localeCompare(b));
    },

    /**
     * Get filtered subjects based on search term
     * @param {string} searchTerm - Search term for filtering
     * @returns {Array} Filtered array of subject names
     */
    getFilteredSubjects(searchTerm) {
        if (!searchTerm || searchTerm.length < 2) {
            return this.getAllSubjects().slice(0, 20); // Return top 20 for performance
        }

        const search = searchTerm.toLowerCase();
        const allSubjects = this.getAllSubjects();
        
        // Exact matches first, then starts with, then contains
        const exactMatches = [];
        const startsWithMatches = [];
        const containsMatches = [];

        allSubjects.forEach(subject => {
            const subjectLower = subject.toLowerCase();
            if (subjectLower === search) {
                exactMatches.push(subject);
            } else if (subjectLower.startsWith(search)) {
                startsWithMatches.push(subject);
            } else if (subjectLower.includes(search)) {
                containsMatches.push(subject);
            }
        });

        return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 20);
    },

    /**
     * Add a new subject manually
     * @param {string} subjectName - Subject name to add
     */
    addSubject(subjectName) {
        const cleanSubject = this.cleanSubjectName(subjectName);
        if (cleanSubject && !this.extractedSubjects.has(cleanSubject)) {
            this.extractedSubjects.add(cleanSubject);
            this.saveToStorage();
            console.log('➕ Added subject:', cleanSubject);
        }
    },

    /**
     * Remove a subject
     * @param {string} subjectName - Subject name to remove
     */
    removeSubject(subjectName) {
        if (this.extractedSubjects.has(subjectName)) {
            this.extractedSubjects.delete(subjectName);
            this.saveToStorage();
            console.log('➖ Removed subject:', subjectName);
        }
    },

    /**
     * Clear all collected subjects
     */
    clearAllSubjects() {
        this.extractedSubjects.clear();
        this.saveToStorage();
        console.log('🗑️ Cleared all collected subjects');
    },

    /**
     * Get statistics about collected subjects
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            totalSubjects: this.extractedSubjects.size,
            extractedSubjects: this.extractedSubjects.size
        };
    },

    /**
     * Save collected subjects to localStorage
     */
    saveToStorage() {
        try {
            const data = {
                extractedSubjects: Array.from(this.extractedSubjects),
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('hkit_collected_subjects', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save subjects to storage:', error);
        }
    },

    /**
     * Load subjects from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('hkit_collected_subjects');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.extractedSubjects && Array.isArray(data.extractedSubjects)) {
                    this.extractedSubjects = new Set(data.extractedSubjects);
                }
            }
        } catch (error) {
            console.warn('Failed to load subjects from storage:', error);
            this.extractedSubjects = new Set();
        }
    },

    /**
     * Export subjects to JSON
     * @returns {string} JSON string of all subjects
     */
    exportToJSON() {
        return JSON.stringify({
            extractedSubjects: Array.from(this.extractedSubjects),
            exportDate: new Date().toISOString(),
            version: '1.0'
        }, null, 2);
    },

    /**
     * Import subjects from JSON
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} Success status
     */
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.extractedSubjects && Array.isArray(data.extractedSubjects)) {
                data.extractedSubjects.forEach(subject => {
                    this.extractedSubjects.add(subject);
                });
                this.saveToStorage();
                console.log('✅ Successfully imported subjects');
                return true;
            }
        } catch (error) {
            console.error('Failed to import subjects:', error);
        }
        return false;
    }
};

// Auto-initialize when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SubjectCollector.init());
} else {
    SubjectCollector.init();
}