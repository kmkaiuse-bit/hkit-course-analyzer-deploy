/**
 * Main Application Controller - Simplified Safe Version
 * Orchestrates the entire HKIT Course Exemption Analyzer
 */

const App = {
    /**
     * Initialize the application safely
     */
    init() {
        try {
            console.log('🎓 HKIT Course Exemption Analyzer - Starting...');
            
            // Initialize modules safely
            this.initializeModules();
            
            // Setup UI safely
            this.setupUI();
            
            // Load programme options safely
            this.loadProgrammeOptions();
            
            console.log('✅ Application initialized successfully');
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleError(error);
        }
    },

    /**
     * Initialize all modules safely
     */
    initializeModules() {
        try {
            // Initialize file handler with error checking
            if (typeof FileHandler !== 'undefined' && FileHandler.init) {
                FileHandler.init();
            }
            
            // 等待 TemplateManager 準備好後再初始化所有模組
            setTimeout(() => {
                if (typeof StudentInfoManager !== 'undefined' && StudentInfoManager.init) {
                    StudentInfoManager.init();
                }
                if (typeof EditModeController !== 'undefined' && EditModeController.init) {
                    EditModeController.init();
                }
                if (typeof StudyPlanGenerator !== 'undefined' && StudyPlanGenerator.init) {
                    StudyPlanGenerator.init();
                }
                if (typeof AdvancedExporter !== 'undefined' && AdvancedExporter.init) {
                    AdvancedExporter.init();
                }
            }, 50);
            
            // Setup event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Module initialization error:', error);
        }
    },

    /**
     * Setup UI components safely
     */
    setupUI() {
        try {
            // Hide results section initially
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }

            // Disable analyze button initially
            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn) {
                analyzeBtn.disabled = true;
            }
        } catch (error) {
            console.error('UI setup error:', error);
        }
    },

    /**
     * Setup event listeners safely
     */
    setupEventListeners() {
        try {
            // Analyze button
            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn) {
                analyzeBtn.removeEventListener('click', this.analyzeHandler); // Remove existing listener
                this.analyzeHandler = () => this.analyzeFiles();
                analyzeBtn.addEventListener('click', this.analyzeHandler);
            }

            // Clear button
            const clearBtn = document.getElementById('clearBtn');
            if (clearBtn) {
                clearBtn.removeEventListener('click', this.clearHandler); // Remove existing listener
                this.clearHandler = () => this.clearAll();
                clearBtn.addEventListener('click', this.clearHandler);
            }

            // View mode radio buttons
            const viewModeRadios = document.querySelectorAll('input[name="viewMode"]');
            viewModeRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    if (typeof switchView === 'function') {
                        switchView();
                    }
                });
            });
        } catch (error) {
            console.error('Event listener setup error:', error);
        }
    },

    /**
     * Load programme options into dropdown safely
     */
    loadProgrammeOptions() {
        try {
            const programmeSelect = document.getElementById('programmeType');
            if (!programmeSelect || typeof TemplateManager === 'undefined') return;

            const options = TemplateManager.getProgrammeOptions();
            
            // Clear existing options (except "Select Programme")
            programmeSelect.innerHTML = '<option value="">Select Programme</option>';
            
            // Add programme options
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = `${option.label} (${option.courseCount} courses)`;
                programmeSelect.appendChild(optionElement);
            });
        } catch (error) {
            console.error('Programme options loading error:', error);
        }
    },

    /**
     * Main analysis function - safely wrapped
     */
    async analyzeFiles() {
        try {
            // Validate inputs
            if (!this.validateInputs()) return;

            // Get selected programme
            const programmeId = document.getElementById('programmeType').value;
            
            // Validate that all uploaded files are PDFs
            const nonPDFFiles = FileHandler.uploadedFiles.filter(f => f.file.type !== 'application/pdf');
            if (nonPDFFiles.length > 0) {
                const fileNames = nonPDFFiles.map(f => f.name).join(', ');
                if (typeof Utils !== 'undefined' && Utils.showError) {
                    Utils.showError(`Only PDF files are supported. Please remove: ${fileNames}`);
                } else {
                    alert(`Only PDF files are supported. Please remove: ${fileNames}`);
                }
                return;
            }

            // Show loading state
            if (typeof Utils !== 'undefined' && Utils.showProgress) {
                Utils.showProgress(10, 'Reading PDF transcript files...');
            }

            // Extract text from PDFs for smart pattern matching
            let extractedText = '';
            let isImageBasedPDF = false;
            if (FileHandler.uploadedFiles.length > 0 && FileHandler.uploadedFiles[0].file.type === 'application/pdf') {
                try {
                    if (typeof Utils !== 'undefined' && Utils.showProgress) {
                        Utils.showProgress(20, 'Extracting text for pattern matching...');
                    }
                    const extractionResult = await FileHandler.extractPDFText(FileHandler.uploadedFiles[0].file);

                    // Handle metadata object
                    if (typeof extractionResult === 'object') {
                        extractedText = extractionResult.text || '';
                        isImageBasedPDF = extractionResult.isImageBased || false;

                        if (isImageBasedPDF) {
                            console.log('📸 Image-based PDF - Gemini will handle OCR + analysis');
                        } else {
                            console.log(`📝 Text-based PDF - extracted ${extractedText.length} characters for smart patterns`);
                        }
                    } else {
                        // Backward compatibility: handle string return
                        extractedText = extractionResult || '';
                        console.log(`📝 Extracted ${extractedText.length} characters for smart pattern matching`);
                    }
                } catch (error) {
                    console.warn('Failed to extract PDF text for pattern matching:', error);
                    // Continue with empty text - smart matcher will be skipped
                }
            }

            if (typeof Utils !== 'undefined' && Utils.showProgress) {
                Utils.showProgress(30, 'Sending to AI for analysis...');
            }

            // Call Gemini API with PDF files array and extracted text
            const results = await GeminiAPI.analyzeTranscripts(extractedText, programmeId, FileHandler.uploadedFiles);
            
            if (typeof Utils !== 'undefined' && Utils.showProgress) {
                Utils.showProgress(80, 'Processing results...');
            }
            
            // Display results
            if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.showResults) {
                ResultsDisplay.showResults(results, programmeId);
            }
            
            // Show student info input after analysis
            if (typeof StudentInfoManager !== 'undefined' && StudentInfoManager.showStudentInfoInput) {
                StudentInfoManager.showStudentInfoInput();
            }
            
            if (typeof Utils !== 'undefined' && Utils.showProgress) {
                Utils.showProgress(100, 'Analysis complete!');
            }
            
            // Hide progress after delay
            setTimeout(() => {
                if (typeof Utils !== 'undefined' && Utils.hideProgress) {
                    Utils.hideProgress();
                }
            }, 1500);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.handleError(error);
        }
    },

    /**
     * Validate inputs before analysis safely (FIXED - No API key check)
     * @returns {boolean} True if valid
     */
    validateInputs() {
        try {
            // Check if FileHandler exists and has files
            if (typeof FileHandler === 'undefined' || !FileHandler.getFileCount || FileHandler.getFileCount() === 0) {
                if (typeof Utils !== 'undefined' && Utils.showError) {
                    Utils.showError('Please upload at least one transcript file');
                } else {
                    alert('Please upload at least one transcript file');
                }
                return false;
            }

            // Check if programme is selected
            const programmeSelect = document.getElementById('programmeType');
            if (!programmeSelect || !programmeSelect.value) {
                if (typeof Utils !== 'undefined' && Utils.showError) {
                    Utils.showError('Please select a programme');
                } else {
                    alert('Please select a programme');
                }
                return false;
            }

            // ✅ REMOVED API key validation - now handled by Vercel Functions
            console.log('🚀 Validation passed - using Vercel Functions for secure API calls');

            return true;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    },

    /**
     * Clear all data and reset application safely
     */
    clearAll() {
        try {
            // Clear files
            if (typeof FileHandler !== 'undefined' && FileHandler.clearFiles) {
                FileHandler.clearFiles();
            }
            
            // Clear results
            if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.clearResults) {
                ResultsDisplay.clearResults();
            }
            
            // Clear student info
            if (typeof StudentInfoManager !== 'undefined' && StudentInfoManager.resetStudentInfo) {
                StudentInfoManager.resetStudentInfo();
            }
            
            // Hide study plan button
            if (typeof StudyPlanGenerator !== 'undefined' && StudyPlanGenerator.hideStudyPlanButton) {
                StudyPlanGenerator.hideStudyPlanButton();
            }
            
            // Reset programme selection
            const programmeSelect = document.getElementById('programmeType');
            if (programmeSelect) {
                programmeSelect.value = '';
            }
            
            // Hide progress
            if (typeof Utils !== 'undefined' && Utils.hideProgress) {
                Utils.hideProgress();
            }
            
            console.log('Application reset');
        } catch (error) {
            console.error('Clear all error:', error);
        }
    },

    /**
     * Handle application errors safely
     * @param {Error} error - Error object
     */
    handleError(error) {
        console.error('Application error:', error);
        
        const errorMessage = error.message || 'An unexpected error occurred';
        
        if (typeof Utils !== 'undefined' && Utils.showError) {
            Utils.showError(errorMessage);
        } else {
            alert('Error: ' + errorMessage);
        }
        
        if (typeof Utils !== 'undefined' && Utils.hideProgress) {
            Utils.hideProgress();
        }
    }
};

/**
 * Global functions for HTML onclick handlers - safely wrapped
 */
function analyzeFiles() {
    try {
        App.analyzeFiles();
    } catch (error) {
        console.error('Analyze files error:', error);
        App.handleError(error);
    }
}

function clearAll() {
    try {
        App.clearAll();
    } catch (error) {
        console.error('Clear all error:', error);
        App.handleError(error);
    }
}

/**
 * Initialize application when DOM is loaded - safely
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Small delay to ensure all modules are loaded
        setTimeout(() => {
            App.init();
        }, 100);
    } catch (error) {
        console.error('DOM loaded initialization error:', error);
    }
});

/**
 * Handle uncaught errors safely
 */
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    if (typeof App !== 'undefined' && App.handleError) {
        App.handleError(event.error);
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (typeof App !== 'undefined' && App.handleError) {
        App.handleError(new Error(event.reason));
    }
});
