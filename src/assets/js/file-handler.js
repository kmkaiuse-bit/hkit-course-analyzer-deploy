/**
 * File Handler
 * Manages file upload, validation, and reading
 */

const FileHandler = {
    // Supported file types
    supportedTypes: ['.csv', '.xlsx', '.xls', '.pdf'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    uploadedFiles: [],

    /**
     * Initialize file handler
     */
    init() {
        this.setupDragAndDrop();
        this.setupFileInput();
    },

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        uploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking on the button itself
            if (e.target.classList.contains('upload-btn') || e.target.closest('.upload-btn')) {
                return;
            }
            document.getElementById('fileInput').click();
        });
    },

    /**
     * Setup file input
     */
    setupFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    },

    /**
     * Handle uploaded files
     * @param {FileList} files - Files to handle
     */
    handleFiles(files) {
        for (let file of files) {
            if (this.validateFile(file)) {
                this.addFile(file);
            }
        }
        this.updateFileList();
    },

    /**
     * Validate file
     * @param {File} file - File to validate
     * @returns {boolean} True if valid
     */
    validateFile(file) {
        // Check file type by extension
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!this.supportedTypes.includes(fileExtension)) {
            Utils.showError(`Unsupported file type: ${fileExtension}. Supported: ${this.supportedTypes.join(', ')}`);
            return false;
        }

        // Additional MIME type check for better validation
        const validMimeTypes = {
            '.pdf': ['application/pdf'],
            '.csv': ['text/csv', 'application/csv', 'text/plain'],
            '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            '.xls': ['application/vnd.ms-excel', 'application/excel']
        };

        const expectedMimes = validMimeTypes[fileExtension];
        if (expectedMimes && !expectedMimes.includes(file.type) && file.type !== '') {
            console.warn(`MIME type mismatch for ${file.name}: expected ${expectedMimes.join(' or ')}, got ${file.type}`);
            // Don't fail validation, just warn - some systems report different MIME types
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            Utils.showError(`File too large: ${Utils.formatFileSize(file.size)}. Max size: ${Utils.formatFileSize(this.maxFileSize)}`);
            return false;
        }

        // Check if file already exists
        if (this.uploadedFiles.find(f => f.name === file.name && f.size === file.size)) {
            Utils.showError(`File already uploaded: ${file.name}`);
            return false;
        }

        return true;
    },

    /**
     * Add file to uploaded files list
     * @param {File} file - File to add
     */
    addFile(file) {
        const fileObj = {
            id: Utils.generateId(),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            content: null,
            processed: false
        };

        this.uploadedFiles.push(fileObj);
    },

    /**
     * Remove file from list
     * @param {string} fileId - File ID to remove
     */
    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        this.updateFileList();
    },

    /**
     * Update file list display
     */
    updateFileList() {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        if (this.uploadedFiles.length === 0) {
            fileList.innerHTML = '';
            this.updateAnalyzeButton();
            return;
        }

        fileList.innerHTML = this.uploadedFiles.map(fileObj => `
            <div class="file-item">
                <span class="file-name">${fileObj.name}</span>
                <span class="file-size">${Utils.formatFileSize(fileObj.size)}</span>
                <button class="remove-file" onclick="FileHandler.removeFile('${fileObj.id}')">×</button>
            </div>
        `).join('');

        this.updateAnalyzeButton();
    },

    /**
     * Update analyze button state
     */
    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = this.uploadedFiles.length === 0;
        }
    },

    /**
     * Read all uploaded files
     * @returns {Promise<Array>} Array of file objects with content
     */
    async readAllFiles() {
        const readPromises = this.uploadedFiles.map(async (fileObj) => {
            if (!fileObj.content) {
                try {
                    fileObj.content = await Utils.readFileAsText(fileObj.file);
                    fileObj.processed = true;
                } catch (error) {
                    console.error(`Error reading file ${fileObj.name}:`, error);
                    throw new Error(`Failed to read file: ${fileObj.name}`);
                }
            }
            return fileObj;
        });

        return Promise.all(readPromises);
    },

    /**
     * Get file count
     * @returns {number} Number of uploaded files
     */
    getFileCount() {
        return this.uploadedFiles.length;
    },

    /**
     * Get all file names
     * @returns {Array<string>} Array of file names
     */
    getFileNames() {
        return this.uploadedFiles.map(f => f.name);
    },

    /**
     * Clear all files
     */
    clearFiles() {
        this.uploadedFiles = [];
        this.updateFileList();
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    },

    /**
     * Get combined file content for analysis
     * @returns {Promise<string>} Combined content from all files
     */
    async getCombinedContent() {
        const files = await this.readAllFiles();
        
        if (files.length === 1) {
            return files[0].content;
        }

        // For multiple files, combine with headers
        let combined = '';
        files.forEach((fileObj, index) => {
            if (index > 0) {
                combined += '\n\n--- Additional Transcript File ---\n';
                combined += `File: ${fileObj.name}\n\n`;
            }
            combined += fileObj.content;
        });

        return combined;
    },

    /**
     * Detect if content is HKIT template format
     * @param {string} content - File content to check
     * @returns {boolean} True if HKIT template format
     */
    isHKITTemplate(content) {
        return content.includes('APPLICATION FOR ADVANCED STANDING') &&
               content.includes('Hong Kong Institute of Technology');
    },

    /**
     * Get file statistics
     * @returns {Object} File statistics
     */
    getStatistics() {
        const totalSize = this.uploadedFiles.reduce((sum, f) => sum + f.size, 0);
        const processedFiles = this.uploadedFiles.filter(f => f.processed).length;

        return {
            totalFiles: this.uploadedFiles.length,
            totalSize: Utils.formatFileSize(totalSize),
            processedFiles,
            fileTypes: [...new Set(this.uploadedFiles.map(f => f.name.split('.').pop().toLowerCase()))]
        };
    }
};
