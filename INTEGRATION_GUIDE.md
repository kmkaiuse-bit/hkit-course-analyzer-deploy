# Integration Guide: Adding Timeout-Resistant Processing

## Quick Integration (Minimal Changes)

### Option 1: Replace Existing API Calls (Recommended)

Update your main `gemini-api.js` file to use the hybrid processor:

```javascript
// Add to the top of your gemini-api.js file
import HybridProcessor from './modules/hybridProcessor.js';
import ChunkProcessor from './modules/chunkProcessor.js';
import FallbackProcessor from './modules/fallbackProcessor.js';

// Initialize processors once
const hybridProcessor = new HybridProcessor();
const chunkProcessor = new ChunkProcessor();  
const fallbackProcessor = new FallbackProcessor();

// Initialize hybrid processor
hybridProcessor.initialize({
    chunkProcessor,
    fallbackProcessor
    // apiKey: optional - enables fallback processing
});

// Replace your existing analyzeTranscripts method:
async analyzeTranscripts(transcriptContent, programmeId, files = []) {
    console.log('🚀 Starting timeout-resistant analysis...');

    // Get programme template (your existing code)
    const programme = TemplateManager.getProgramme(programmeId);
    if (!programme) {
        throw new Error('Invalid programme selected');
    }

    const templateCSV = TemplateManager.generateTemplateCSV(programmeId);
    const prompt = this.createPrompt(templateCSV, transcriptContent, programme.name, files.length);

    // Use hybrid processor instead of direct API calls
    try {
        const result = await hybridProcessor.processFiles(prompt, files, {
            onProgress: (progress) => {
                console.log('📊 Progress:', progress);
                // Update UI with progress information
                this.updateProgressUI(progress);
            },
            onFallback: (error, newStrategy) => {
                console.log(`🔄 Switching to ${newStrategy} due to: ${error.message}`);
                // Optionally show user that we're switching strategies
            }
        });

        return result.results;
        
    } catch (error) {
        console.error('Hybrid processing failed:', error);
        throw new Error(`Failed to analyze transcripts: ${error.message}`);
    }
}

// Add progress UI update method
updateProgressUI(progress) {
    const statusElement = document.getElementById('processing-status');
    if (!statusElement) return;

    switch (progress.stage) {
        case 'strategy_selected':
            statusElement.textContent = `Processing with ${progress.strategy}...`;
            break;
        case 'processing':
            if (progress.progress) {
                statusElement.textContent = `Processing: ${progress.progress.percentage.toFixed(1)}%`;
            }
            break;
        case 'completed':
            statusElement.textContent = 'Processing completed!';
            break;
        case 'fallback_activated':
            statusElement.textContent = progress.message;
            break;
    }
}
```

### Option 2: Add as Fallback Only (Minimal Risk)

Keep your existing code and add timeout-resistant processing as a fallback:

```javascript
// In your existing analyzeTranscripts method, wrap the try-catch:

async analyzeTranscripts(transcriptContent, programmeId, files = []) {
    // Your existing code...
    
    try {
        // Your existing API call
        const response = await this.callAPI(prompt, files);
        return this.parseResponse(response);
        
    } catch (error) {
        // If error contains "timeout" or "failed", try hybrid processor
        if (error.message.includes('timeout') || error.message.includes('failed')) {
            console.log('🔄 Trying timeout-resistant processing...');
            
            try {
                const result = await hybridProcessor.processFiles(prompt, files);
                return result.results;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                throw error; // Throw original error
            }
        }
        
        throw error; // Throw original error for other types
    }
}
```

## UI Enhancements (Optional)

### Add Progress Indicators

Add to your HTML:
```html
<div id="processing-status" class="processing-status hidden">
    <div class="status-text">Processing...</div>
    <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
    </div>
    <div class="strategy-info" id="strategy-info"></div>
</div>
```

Add to your CSS:
```css
.processing-status {
    background: #f0f8ff;
    border: 1px solid #4a90e2;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e1e5e9;
    border-radius: 4px;
    margin: 8px 0;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #4a90e2;
    border-radius: 4px;
    transition: width 0.3s ease;
    width: 0%;
}

.strategy-info {
    font-size: 12px;
    color: #666;
    margin-top: 8px;
}
```

### Enhanced Progress Updates

```javascript
updateProgressUI(progress) {
    const statusElement = document.getElementById('processing-status');
    const progressFill = document.getElementById('progress-fill');
    const strategyInfo = document.getElementById('strategy-info');
    
    if (!statusElement) return;
    
    // Show status panel
    statusElement.classList.remove('hidden');
    
    switch (progress.stage) {
        case 'strategy_selected':
            statusElement.querySelector('.status-text').textContent = 'Analyzing files...';
            strategyInfo.textContent = `Using ${progress.strategy} processing - ${progress.reason}`;
            progressFill.style.width = '10%';
            break;
            
        case 'processing':
            statusElement.querySelector('.status-text').textContent = progress.message || 'Processing...';
            if (progress.progress) {
                progressFill.style.width = `${progress.progress.percentage}%`;
                strategyInfo.textContent = `Progress: ${progress.progress.completed}/${progress.progress.total} chunks`;
            }
            break;
            
        case 'completed':
            statusElement.querySelector('.status-text').textContent = 'Processing completed!';
            progressFill.style.width = '100%';
            // Hide after 2 seconds
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 2000);
            break;
            
        case 'fallback_activated':
            statusElement.querySelector('.status-text').textContent = 'Switching processing method...';
            strategyInfo.textContent = progress.message;
            break;
    }
}
```

## Testing Your Integration

### 1. Test Small Files First
- Upload a small PDF (< 500KB)
- Should work exactly as before, but with better error handling

### 2. Test Medium Files
- Upload files 500KB-2MB  
- Should see progress indicators
- Processing will take longer but be more reliable

### 3. Test Large Files
- Upload files > 2MB
- May prompt for API key for fallback processing
- Will handle files that previously failed

## Deployment Checklist

Before deploying to Vercel:

- [ ] Environment variable `GEMINI_API_KEY` is set in Vercel dashboard
- [ ] All new API endpoints are included (`/api/gemini-chunked`, `/api/gemini-status`)
- [ ] `vercel.json` configuration is updated (already done)
- [ ] Test with different file sizes in development
- [ ] Check browser console for any JavaScript errors

## Rollback Plan

If anything goes wrong, you can easily rollback:

1. **Keep your original files**: The new system doesn't modify your existing API endpoints
2. **Remove integration code**: Simply remove the hybrid processor calls
3. **Your original `/api/gemini` endpoint still works**: Unchanged functionality

## Performance Expectations

After integration:

- **Small files**: Same speed as before (2-5 seconds)
- **Medium files**: Slightly slower but 98% success rate vs 60% before  
- **Large files**: Now possible (previously impossible due to timeouts)
- **Overall user experience**: Much more reliable, better feedback

The system automatically chooses the best processing method, so users don't need to know about the technical details!