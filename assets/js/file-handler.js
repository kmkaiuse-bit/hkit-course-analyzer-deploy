/**
 * File Handler
 * Manages file upload, validation, and reading
 */

const FileHandler = {
    // Supported file types (PDF only)
    supportedTypes: ['.pdf'],
    maxFileSize: 20 * 1024 * 1024, // 20MB (Gemini API limit)
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

        if (fileExtension !== '.pdf') {
            Utils.showError(`Only PDF files are supported. You tried to upload: ${file.name} (${fileExtension})`);
            return false;
        }

        // Additional MIME type check for PDF
        if (file.type !== '' && file.type !== 'application/pdf') {
            console.warn(`MIME type mismatch for ${file.name}: expected application/pdf, got ${file.type}`);
            // Don't fail validation, just warn - some systems report different MIME types
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            const fileSize = Utils.formatFileSize(file.size);
            const maxSize = Utils.formatFileSize(this.maxFileSize);
            Utils.showError(
                `PDF file "${file.name}" is too large (${fileSize}).\n\n` +
                `Maximum file size: ${maxSize}\n\n` +
                `Tip: Try compressing the PDF or splitting it into smaller files.`
            );
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
        this.updateTranscriptButton();
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
     * Update transcript button visibility
     */
    updateTranscriptButton() {
        const transcriptDisplay = document.getElementById('transcriptDisplay');
        
        if (!transcriptDisplay) return;

        if (this.uploadedFiles.length === 0) {
            transcriptDisplay.style.display = 'none';
        } else {
            transcriptDisplay.style.display = 'block';
        }
    },

    /**
     * Get files with preview content (first few lines for large files)
     */
    async getFilesWithPreview() {
        const filesWithPreview = [];
        
        for (const fileObj of this.uploadedFiles) {
            const preview = {
                name: fileObj.name,
                type: fileObj.type,
                size: fileObj.size,
                content: null,
                error: null
            };
            
            try {
                // Handle PDF files differently
                if (fileObj.file.type === 'application/pdf') {
                    preview.content = await this.extractPDFPreview(fileObj.file);
                } else {
                    // Read file content for non-PDF files
                    const content = await Utils.readFileAsText(fileObj.file);
                    
                    // For large files, show only first 1000 characters
                    if (content.length > 1000) {
                        preview.content = content.substring(0, 1000) + '\n\n... [Content truncated - showing first 1000 characters]';
                    } else {
                        preview.content = content;
                    }
                }
            } catch (error) {
                preview.error = error.message;
            }
            
            filesWithPreview.push(preview);
        }
        
        return filesWithPreview;
    },

    /**
     * Generate HTML for transcript display
     */
    generateTranscriptHTML(files) {
        if (!files || files.length === 0) {
            return '<div class="transcript-empty">No files uploaded</div>';
        }

        return files.map(file => {
            const fileTypeIcon = this.getFileTypeIcon(file.name);
            const fileSize = Utils.formatFileSize(file.size);
            
            return `
                <div class="transcript-file">
                    <div class="transcript-file-header">
                        ${fileTypeIcon} ${file.name} (${fileSize})
                    </div>
                    ${file.error ? 
                        `<div class="transcript-empty">Error: ${file.error}</div>` :
                        this.formatTranscriptContent(file.content, file.name)
                    }
                </div>
            `;
        }).join('');
    },

    /**
     * Format transcript content based on file type
     */
    formatTranscriptContent(content, fileName) {
        const fileExt = fileName.toLowerCase().split('.').pop();
        
        if (fileExt === 'csv') {
            return this.formatCSVContent(content);
        } else if (fileExt === 'pdf') {
            return `<div class="transcript-text">${content}</div>`;
        } else {
            return `<div class="transcript-text">${content}</div>`;
        }
    },

    /**
     * Format CSV content as table
     */
    formatCSVContent(content) {
        try {
            const lines = content.trim().split('\n');
            if (lines.length === 0) return '<div class="transcript-empty">Empty file</div>';
            
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
            
            // Show only first 10 rows for preview
            const previewRows = rows.slice(0, 10);
            
            let tableHTML = `
                <table class="transcript-table">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${previewRows.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${cell}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            if (rows.length > 10) {
                tableHTML += `<div class="transcript-empty">... and ${rows.length - 10} more rows</div>`;
            }
            
            return tableHTML;
        } catch (error) {
            return `<div class="transcript-text">${content}</div>`;
        }
    },

    /**
     * Get file type icon
     */
    getFileTypeIcon(fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        const icons = {
            'pdf': '📄',
            'csv': '📊',
            'xlsx': '📊',
            'xls': '📊'
        };
        return icons[ext] || '📁';
    },

    /**
     * Extract PDF preview content
     */
    async extractPDFPreview(file) {
        try {
            // Simple PDF info extraction (without full parsing)
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Convert to string to look for basic PDF info
            const pdfString = Array.from(uint8Array.slice(0, 2000))
                .map(byte => String.fromCharCode(byte))
                .join('');

            // Extract basic PDF metadata if available
            const info = [];
            info.push(`📄 PDF File: ${file.name}`);
            info.push(`📊 File Size: ${Utils.formatFileSize(file.size)}`);
            info.push(`📅 Last Modified: ${new Date(file.lastModified).toLocaleDateString()}`);

            // Try to find PDF version
            const versionMatch = pdfString.match(/%PDF-(\d+\.\d+)/);
            if (versionMatch) {
                info.push(`📋 PDF Version: ${versionMatch[1]}`);
            }

            info.push('');
            info.push('⚠️ PDF Content Preview:');
            info.push('Full PDF text extraction requires PDF processing during analysis.');
            info.push('The actual transcript content will be analyzed when you click "Analyze".');
            info.push('');
            info.push('This preview shows file information only.');
            info.push('PDF text content is processed by the Gemini AI during exemption analysis.');

            return info.join('\n');
        } catch (error) {
            return `❌ Error reading PDF: ${error.message}\n\nThis PDF will be processed during analysis.`;
        }
    },

    /**
     * Extract text content from PDF for smart pattern matching
     * @param {File} file - PDF file object
     * @returns {Promise<string>} Extracted text content
     */
    async extractPDFText(file) {
        try {
            console.log('📄 Extracting text from PDF for smart pattern matching...');

            // Wait for PDF.js to be available (with timeout)
            let attempts = 0;
            while (typeof window.pdfjsLib === 'undefined' && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            // Check if PDF.js is available
            if (typeof window.pdfjsLib === 'undefined') {
                console.warn('⚠️ PDF.js not loaded after timeout, cannot extract text');
                return '';
            }

            const pdfjsLib = window.pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

            console.log('✅ PDF.js loaded, starting extraction...');

            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            console.log(`📄 File size: ${arrayBuffer.byteLength} bytes`);

            // Load PDF
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

            // Extract text from all pages
            const textContent = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const content = await page.getTextContent();

                console.log(`📄 Page ${pageNum}: ${content.items.length} text items`);

                // Combine all text items from the page
                const pageText = content.items
                    .map(item => {
                        // Handle both string and object formats
                        if (typeof item === 'string') {
                            return item;
                        } else if (item.str !== undefined) {
                            return item.str;
                        } else if (item.text !== undefined) {
                            return item.text;
                        }
                        return '';
                    })
                    .filter(text => text.trim().length > 0)  // Remove empty strings
                    .join(' ');

                console.log(`📄 Page ${pageNum} text length: ${pageText.length} characters`);

                if (pageText.length > 0) {
                    textContent.push(pageText);
                }
            }

            const fullText = textContent.join('\n\n');  // Use double newline for better separation
            console.log(`✅ Extracted ${fullText.length} characters from ${pdf.numPages} pages`);

            // Detect image-based PDFs (scanned documents with no text layer)
            const isImageBased = fullText.length < 100;  // Less than 100 chars from multi-page PDF = likely image-based

            // Log a sample of extracted text for debugging
            if (fullText.length > 0 && !isImageBased) {
                console.log(`📝 Sample text (first 200 chars): ${fullText.substring(0, 200)}`);
                console.log('✅ Text-based PDF detected - smart patterns will work');
            } else if (isImageBased) {
                console.warn('📸 Image-based PDF detected (scanned document)');
                console.warn('🔄 Skipping client-side text extraction - Gemini will handle OCR');
            }

            // Return metadata object instead of just string
            return {
                text: fullText,
                isImageBased: isImageBased,
                pageCount: pdf.numPages
            };

        } catch (error) {
            console.error('PDF text extraction error:', error);
            // Return metadata object even on error for consistency
            return {
                text: '',
                isImageBased: true,
                pageCount: 0
            };
        }
    },

    /**
     * Open transcript viewer in popup window
     */
    async openTranscriptWindow() {
        try {
            // Create popup window
            const popup = window.open('', 'transcriptViewer', 
                'width=1000,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
            );
            
            if (!popup) {
                Utils.showError('Popup blocked. Please allow popups for this site.');
                return;
            }
            
            // Set up popup window content
            popup.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Transcript Viewer - HKIT Course Analyzer</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
                    <style>
                        body {
                            font-family: 'Segoe UI', system-ui, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background: #f5f5f5;
                        }
                        .header {
                            background: #667eea;
                            color: white;
                            padding: 15px 20px;
                            margin: -20px -20px 20px -20px;
                            border-radius: 0;
                        }
                        .file-tabs {
                            display: flex;
                            border-bottom: 2px solid #e2e8f0;
                            margin-bottom: 20px;
                            gap: 5px;
                        }
                        .file-tab {
                            padding: 10px 20px;
                            background: #f7fafc;
                            border: none;
                            border-radius: 8px 8px 0 0;
                            cursor: pointer;
                            border-bottom: 3px solid transparent;
                            font-weight: 500;
                            transition: all 0.2s;
                        }
                        .file-tab:hover {
                            background: #edf2f7;
                        }
                        .file-tab.active {
                            background: white;
                            border-bottom-color: #667eea;
                            color: #667eea;
                        }
                        .file-content {
                            background: white;
                            border-radius: 8px;
                            padding: 20px;
                            min-height: 400px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        }
                        .file-content.hidden {
                            display: none;
                        }
                        .pdf-viewer {
                            width: 100%;
                            min-height: 500px;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                        }
                        .csv-table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 0.9rem;
                        }
                        .csv-table th, .csv-table td {
                            border: 1px solid #e2e8f0;
                            padding: 8px 12px;
                            text-align: left;
                        }
                        .csv-table th {
                            background: #f7fafc;
                            font-weight: 600;
                        }
                        .csv-table tr:nth-child(even) {
                            background: #f9fafb;
                        }
                        .text-content {
                            font-family: 'Courier New', monospace;
                            background: #f7fafc;
                            padding: 15px;
                            border-radius: 6px;
                            white-space: pre-wrap;
                            line-height: 1.4;
                            max-height: 500px;
                            overflow-y: auto;
                        }
                        .loading {
                            text-align: center;
                            color: #666;
                            font-style: italic;
                            padding: 40px;
                        }
                        .error {
                            color: #e53e3e;
                            background: #fed7d7;
                            padding: 15px;
                            border-radius: 6px;
                            border: 1px solid #feb2b2;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>📄 Transcript Viewer</h1>
                        <p>Review uploaded transcript content</p>
                        <div style="background: rgba(255, 255, 255, 0.2); padding: 8px 12px; border-radius: 6px; margin-top: 10px; font-size: 0.85rem;">
                            💡 <strong>Tip:</strong> If you see a blank window or any issues, please close and reopen this viewer.
                        </div>
                    </div>
                    <div id="tabContainer" class="file-tabs"></div>
                    <div id="contentContainer"></div>
                </body>
                </html>
            `);

            popup.document.close();

            // Wait for PDF.js to be fully loaded in main window
            // This ensures first-time clicks work properly
            if (typeof window.pdfjsLib === 'undefined') {
                // Show loading message while waiting
                const contentContainer = popup.document.getElementById('contentContainer');
                if (contentContainer) {
                    contentContainer.innerHTML = '<div class="loading">⏳ Loading PDF library...</div>';
                }

                // Wait for PDF.js to load (max 5 seconds)
                let attempts = 0;
                while (typeof window.pdfjsLib === 'undefined' && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (typeof window.pdfjsLib === 'undefined') {
                    const contentContainer = popup.document.getElementById('contentContainer');
                    if (contentContainer) {
                        contentContainer.innerHTML = '<div class="error">PDF.js library failed to load. Please refresh the page and try again.</div>';
                    }
                    return;
                }
            }

            // Load and display files
            await this.populateTranscriptWindow(popup);
            
        } catch (error) {
            console.error('Error opening transcript window:', error);
            Utils.showError('Failed to open transcript viewer: ' + error.message);
        }
    },

    /**
     * Populate transcript window with file content
     */
    async populateTranscriptWindow(popup) {
        const tabContainer = popup.document.getElementById('tabContainer');
        const contentContainer = popup.document.getElementById('contentContainer');
        
        if (!tabContainer || !contentContainer) return;
        
        // Show loading
        contentContainer.innerHTML = '<div class="loading">Loading transcript files...</div>';
        
        try {
            // Create tabs for each file
            this.uploadedFiles.forEach((fileObj, index) => {
                const tab = popup.document.createElement('button');
                tab.className = `file-tab ${index === 0 ? 'active' : ''}`;
                tab.textContent = `${this.getFileTypeIcon(fileObj.name)} ${fileObj.name}`;
                tab.onclick = () => this.switchTab(popup, index);
                tabContainer.appendChild(tab);
            });
            
            // Load first file content
            if (this.uploadedFiles.length > 0) {
                await this.switchTab(popup, 0);
            }
            
        } catch (error) {
            contentContainer.innerHTML = `<div class="error">Error loading files: ${error.message}</div>`;
        }
    },

    /**
     * Switch to different file tab in popup
     */
    async switchTab(popup, index) {
        const tabs = popup.document.querySelectorAll('.file-tab');
        const contentContainer = popup.document.getElementById('contentContainer');
        
        // Update tab states
        tabs.forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
        });
        
        // Show loading
        contentContainer.innerHTML = '<div class="loading">Loading file content...</div>';
        
        try {
            const fileObj = this.uploadedFiles[index];
            const content = await this.renderFileContent(fileObj, popup);
            contentContainer.innerHTML = `<div class="file-content">${content}</div>`;
        } catch (error) {
            contentContainer.innerHTML = `<div class="error">Error loading ${fileObj.name}: ${error.message}</div>`;
        }
    },

    /**
     * Render file content based on type
     */
    async renderFileContent(fileObj, popup) {
        const fileExt = fileObj.name.toLowerCase().split('.').pop();
        
        if (fileExt === 'pdf') {
            return await this.renderPDFContent(fileObj, popup);
        } else if (fileExt === 'csv') {
            const content = await Utils.readFileAsText(fileObj.file);
            return this.renderCSVContent(content);
        } else {
            const content = await Utils.readFileAsText(fileObj.file);
            return `<div class="text-content">${content}</div>`;
        }
    },

    /**
     * Render PDF content using PDF.js
     */
    async renderPDFContent(fileObj, popup) {
        try {
            console.log('Starting PDF rendering for:', fileObj.name);

            // Use PDF.js from parent window instead of popup window
            const pdfjsLib = window.pdfjsLib;
            if (!pdfjsLib) {
                console.error('PDF.js not available');
                return '<div class="error">PDF.js not loaded. Please refresh the page and try again.</div>';
            }

            console.log('PDF.js available, setting worker source...');

            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

            // Read file as array buffer (cache it for reuse)
            console.log('Reading file as array buffer...');

            // Use cached arrayBuffer if available, otherwise read and cache it
            if (!fileObj.arrayBuffer) {
                console.log('Reading ArrayBuffer from File object for the first time...');
                fileObj.arrayBuffer = await fileObj.file.arrayBuffer();
                console.log('ArrayBuffer cached for future use');
            } else {
                console.log('Using cached ArrayBuffer');
            }

            const arrayBuffer = fileObj.arrayBuffer;
            console.log('Array buffer size:', arrayBuffer.byteLength);

            // Load PDF
            console.log('Loading PDF document...');
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            console.log('PDF loaded, pages:', pdf.numPages);

            // Check if PDF has pages
            if (!pdf.numPages || pdf.numPages === 0) {
                throw new Error('The document has no pages or is corrupted');
            }

            // Get content container for progress updates
            const contentContainer = popup.document.getElementById('contentContainer');

            let pdfHTML = '<div class="pdf-viewer">';

            // Render each page with progress updates
            const pageElements = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) { // Render ALL pages
                // Update loading message with progress
                if (contentContainer) {
                    contentContainer.innerHTML = `<div class="loading">📄 Rendering page ${pageNum} of ${pdf.numPages}...</div>`;
                }

                console.log(`Rendering page ${pageNum}...`);
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.2 });
                console.log(`Page ${pageNum} viewport:`, viewport.width, 'x', viewport.height);

                // Create canvas in parent window context
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style.maxWidth = '100%';
                canvas.style.height = 'auto';
                canvas.style.border = '1px solid #e2e8f0';

                console.log(`Rendering page ${pageNum} to canvas...`);
                // Render page
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                console.log(`Page ${pageNum} rendered successfully`);

                // Convert canvas to data URL for cross-window compatibility
                const dataURL = canvas.toDataURL('image/png');
                console.log(`Page ${pageNum} data URL length:`, dataURL.length);

                pdfHTML += `
                    <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="background: #f7fafc; padding: 8px; font-weight: 500; border-bottom: 1px solid #e2e8f0;">
                            Page ${pageNum} of ${pdf.numPages}
                        </div>
                        <div style="text-align: center; padding: 10px;">
                            <img src="${dataURL}" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0;" alt="Page ${pageNum}">
                        </div>
                    </div>
                `;
            }

            pdfHTML += '</div>';
            return pdfHTML;
            
        } catch (error) {
            console.error('PDF rendering error:', error);
            return `<div class="error">Error rendering PDF: ${error.message}</div>`;
        }
    },

    /**
     * Render CSV content as table
     */
    renderCSVContent(content) {
        try {
            const lines = content.trim().split('\n');
            if (lines.length === 0) return '<div class="error">Empty CSV file</div>';
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
            const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/['"]/g, '')));
            
            let tableHTML = `
                <table class="csv-table">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${cell}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            return tableHTML;
        } catch (error) {
            return `<div class="error">Error parsing CSV: ${error.message}</div>`;
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
    },

    /**
     * Clear all uploaded files and reset UI
     */
    clearAllFiles() {
        try {
            // Clear uploaded files array
            this.uploadedFiles = [];
            
            // Reset file input
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Reset upload area display
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                uploadArea.innerHTML = `
                    <div class="upload-icon">📄</div>
                    <p><strong>Drop CSV/Excel/PDF files here</strong></p>
                    <p>or <button onclick="document.getElementById('fileInput').click()" class="upload-btn">Browse Files</button></p>
                    <div class="file-types">Supported: CSV, Excel, PDF</div>
                `;
            }
            
            // Clear transcript content display
            const transcriptContent = document.getElementById('transcriptContent');
            if (transcriptContent) {
                transcriptContent.innerHTML = '';
            }
            
            // Reset transcript toggle button
            const transcriptToggle = document.getElementById('transcriptToggle');
            if (transcriptToggle) {
                transcriptToggle.style.display = 'none';
            }
            
            console.log('✅ All files cleared successfully');
            
        } catch (error) {
            console.error('Error clearing files:', error);
            throw error;
        }
    }
};
