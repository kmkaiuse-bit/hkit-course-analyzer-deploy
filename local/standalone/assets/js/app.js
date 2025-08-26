/**
 * Main App Controller - Simple Local Version
 */

const App = {
    init() {
        console.log('🎓 HKIT Course Analyzer - Local Version Starting...');
        
        // Initialize modules
        FileHandler.init();
        
        // Setup UI
        this.setupEventListeners();
        this.loadProgrammeOptions();
        
        console.log('✅ Application initialized');
    },

    setupEventListeners() {
        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeFiles());
        }

        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }

        // Programme selection change
        const programmeSelect = document.getElementById('programmeType');
        if (programmeSelect) {
            programmeSelect.addEventListener('change', () => {
                FileHandler.enableAnalyzeButton();
            });
        }

        // View mode toggles
        const viewModeRadios = document.querySelectorAll('input[name="viewMode"]');
        viewModeRadios.forEach(radio => {
            radio.addEventListener('change', this.switchView);
        });
    },

    loadProgrammeOptions() {
        const programmeSelect = document.getElementById('programmeType');
        if (!programmeSelect) return;

        const options = TemplateManager.getProgrammeOptions();
        
        programmeSelect.innerHTML = '<option value="">Select Programme</option>';
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = `${option.label} (${option.courseCount} courses)`;
            programmeSelect.appendChild(optionElement);
        });
    },

    async analyzeFiles() {
        try {
            if (!this.validateInputs()) return;

            const programmeId = document.getElementById('programmeType').value;
            
            Utils.showProgress(10, 'Reading files...');
            
            // Get transcript content
            const transcriptContent = await FileHandler.getCombinedContent();
            
            Utils.showProgress(30, 'Sending to AI...');
            
            // Analyze with Gemini
            const results = await GeminiAPI.analyzeTranscripts(
                transcriptContent, 
                programmeId, 
                FileHandler.uploadedFiles
            );
            
            Utils.showProgress(80, 'Processing results...');
            
            // Display results
            ResultsDisplay.showResults(results, programmeId);
            
            Utils.showProgress(100, 'Complete!');
            
            setTimeout(() => Utils.hideProgress(), 1500);
            
        } catch (error) {
            console.error('Analysis error:', error);
            Utils.hideProgress();
            Utils.showError(error.message);
        }
    },

    validateInputs() {
        if (FileHandler.getFileCount() === 0) {
            Utils.showError('Please upload at least one file');
            return false;
        }

        const programmeSelect = document.getElementById('programmeType');
        if (!programmeSelect.value) {
            Utils.showError('Please select a programme');
            return false;
        }

        if (!API_CONFIG.isValidated) {
            Utils.showError('Please configure your API key first');
            return false;
        }

        return true;
    },

    clearAll() {
        FileHandler.clearFiles();
        ResultsDisplay.clearResults();
        
        const programmeSelect = document.getElementById('programmeType');
        if (programmeSelect) {
            programmeSelect.value = '';
        }
        
        Utils.hideProgress();
        console.log('Application cleared');
    },

    switchView() {
        const tableView = document.getElementById('tableView');
        const jsonView = document.getElementById('jsonView');
        const selectedMode = document.querySelector('input[name="viewMode"]:checked').value;
        
        if (selectedMode === 'table') {
            tableView.style.display = 'block';
            jsonView.style.display = 'none';
        } else {
            tableView.style.display = 'none';
            jsonView.style.display = 'block';
            
            // Show JSON
            const jsonOutput = document.getElementById('jsonOutput');
            if (jsonOutput && ResultsDisplay.currentResults) {
                jsonOutput.textContent = JSON.stringify(ResultsDisplay.currentResults, null, 2);
            }
        }
    }
};

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
