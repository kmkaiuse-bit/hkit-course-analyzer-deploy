/**
 * File Handler - Simple Local Version
 */

const FileHandler = {
    uploadedFiles: [],

    init() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        }

        if (uploadArea) {
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

            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });
        }
    },

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.uploadedFiles.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    id: Math.random().toString(36).substr(2, 9)
                });
            }
        });

        this.updateFileList();
        this.enableAnalyzeButton();
    },

    validateFile(file) {
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/pdf'
        ];

        if (!validTypes.includes(file.type)) {
            Utils.showError(`Unsupported file type: ${file.name}`);
            return false;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            Utils.showError(`File too large: ${file.name}. Maximum size is 50MB.`);
            return false;
        }

        return true;
    },

    updateFileList() {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        if (this.uploadedFiles.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        fileList.innerHTML = `
            <h4>📁 Uploaded Files (${this.uploadedFiles.length})</h4>
            <div class="file-items">
                ${this.uploadedFiles.map(fileObj => `
                    <div class="file-item">
                        <span class="file-name">📄 ${fileObj.name}</span>
                        <span class="file-size">(${Utils.formatFileSize(fileObj.size)})</span>
                        <button class="remove-btn" onclick="FileHandler.removeFile('${fileObj.id}')">❌</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        this.updateFileList();
        this.enableAnalyzeButton();
    },

    clearFiles() {
        this.uploadedFiles = [];
        this.updateFileList();
        this.enableAnalyzeButton();
        
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    },

    async getCombinedContent() {
        let content = '';
        
        for (const fileObj of this.uploadedFiles) {
            if (fileObj.file.type !== 'application/pdf') {
                try {
                    const text = await this.readFileAsText(fileObj.file);
                    content += `\n=== ${fileObj.name} ===\n${text}\n`;
                } catch (error) {
                    console.error(`Error reading ${fileObj.name}:`, error);
                }
            }
        }
        
        return content;
    },

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    getFileCount() {
        return this.uploadedFiles.length;
    },

    enableAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const programmeSelect = document.getElementById('programmeType');
        
        if (analyzeBtn && programmeSelect) {
            analyzeBtn.disabled = !(this.uploadedFiles.length > 0 && programmeSelect.value);
        }
    }
};

window.FileHandler = FileHandler;
