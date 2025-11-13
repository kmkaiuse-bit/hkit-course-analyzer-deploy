/**
 * Gemini API Integration - 安全版本  
 * 通过Vercel Functions调用，不暴露API密钥
 */

const GeminiAPI = {
    /**
     * Call Gemini API for course exemption analysis
     * @param {string} transcriptContent - Student transcript content (for text files)  
     * @param {string} programmeId - Selected programme ID
     * @param {Array} files - Array of file objects (for PDF support)
     * @returns {Promise<Array>} Analysis results
     */
    async analyzeTranscripts(transcriptContent, programmeId, files = []) {
        console.log('🚀 Starting smart pattern analysis...');

        // Get programme template
        const programme = TemplateManager.getProgramme(programmeId);
        if (!programme) {
            throw new Error('Invalid programme selected');
        }

        // Extract subjects from transcript
        const extractedSubjects = this.extractSubjectsFromTranscript(transcriptContent, files);
        console.log('📝 Extracted subjects:', extractedSubjects);

        // SMART PATTERN MATCHING: Check for existing patterns
        let smartResult = null;
        let learningPatterns = {};

        if (typeof window !== 'undefined' && window.learningClient && window.SmartPatternMatcher) {
            try {
                // Get learning patterns from database
                learningPatterns = await window.learningClient.getRelevantPatterns(extractedSubjects, 0.3);

                // Process with smart pattern matcher (with programme context for filtering)
                smartResult = await window.SmartPatternMatcher.processWithPatterns(
                    extractedSubjects,
                    learningPatterns,
                    programme,
                    programme.id  // Add programme code for context filtering
                );

                console.log(`🧠 Smart Pattern Results: ${smartResult.stats.autoApplied} auto-applied, ${smartResult.stats.pendingAnalysis} need AI analysis`);

            } catch (error) {
                console.warn('Smart pattern matching failed:', error.message);
                smartResult = null;
            }
        }

        let aiResults = [];

        // Only call AI for courses that need analysis
        if (!smartResult || smartResult.pendingForAI.length > 0) {
            try {
                let prompt;

                if (smartResult && window.SmartPatternMatcher) {
                    // Use optimized prompt with smart results
                    const templateCSV = TemplateManager.generateTemplateCSV(programmeId);
                    prompt = window.SmartPatternMatcher.generateOptimizedPrompt(
                        templateCSV,
                        transcriptContent,
                        programme.name,
                        smartResult
                    );
                    console.log('🎯 Using optimized AI prompt with pre-applied patterns');
                } else {
                    // Fallback to traditional prompt
                    const templateCSV = TemplateManager.generateTemplateCSV(programmeId);
                    prompt = this.createPrompt(templateCSV, transcriptContent, programme.name, files.length);
                    console.log('⚠️ Using traditional AI prompt (smart matching unavailable)');
                }

                // Call API
                const response = await this.callAPI(prompt, files);
                aiResults = this.parseResponse(response);

            } catch (error) {
                console.error('Gemini API error:', error);
                throw new Error(`Failed to analyze transcripts: ${error.message}`);
            }
        } else {
            console.log('✨ All courses auto-applied via smart patterns - no AI analysis needed!');
        }

        // Merge results
        let finalResults;
        if (smartResult && window.SmartPatternMatcher) {
            finalResults = window.SmartPatternMatcher.mergeResults(smartResult, aiResults);
        } else {
            finalResults = aiResults;
        }

        // LEARNING RECORDING: Record results for future learning
        if (typeof window !== 'undefined' && window.learningClient && finalResults) {
            try {
                if (!smartResult) {
                    // Image-based PDFs or text extraction failed - record all results from Gemini
                    await window.learningClient.recordAnalysisResults(finalResults, programme.id);
                    console.log('📊 Recorded all analysis results for learning (no smart patterns used)');
                } else if (aiResults && aiResults.length > 0) {
                    // Text-based PDFs with smart patterns - record only AI-analyzed courses
                    await window.learningClient.recordAnalysisResults(aiResults, programme.id);
                    console.log(`📊 Recorded ${aiResults.length} AI-analyzed results for learning (${smartResult.stats.autoApplied} were auto-applied)`);
                }
            } catch (error) {
                console.warn('Learning recording failed:', error.message);
            }
        }

        console.log(`✅ Analysis complete: ${finalResults.length} total results`);
        return finalResults;
    },

    /**
     * Extract subject names from transcript content
     * Simple extraction - can be improved with better parsing
     */
    extractSubjectsFromTranscript(transcriptContent, files = []) {
        if (!transcriptContent || transcriptContent.trim() === '') {
            return [];
        }

        // Simple regex patterns to find course/subject names
        const patterns = [
            // Common course patterns
            /([A-Za-z][A-Za-z\s]+(?:Programming|Development|Management|Design|Analysis|Systems|Science|Studies|English|Chinese|Business|Mathematics|Statistics|Database|Web|Network|Security))/gi,
            // Course codes with names
            /[A-Z]{2,4}\s*\d{3,4}[A-Z]?\s*[-:]?\s*([A-Za-z][A-Za-z\s]{10,40})/gi,
            // Line-based course extraction (common in transcripts)
            /^([A-Za-z][A-Za-z\s&]{5,50})\s*[A-F]?\+?$/gm,
        ];

        const subjects = new Set();

        patterns.forEach(pattern => {
            const matches = transcriptContent.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Clean up the match
                    let subject = match.replace(/[A-Z]{2,4}\s*\d{3,4}[A-Z]?\s*[-:]?\s*/, '').trim();
                    subject = subject.replace(/\s*[A-F]\+?$/, '').trim();

                    // Filter out short or invalid matches
                    if (subject.length >= 8 && subject.length <= 60) {
                        subjects.add(subject);
                    }
                });
            }
        });

        const result = Array.from(subjects);
        console.log(`📝 Extracted ${result.length} subjects from transcript:`, result.slice(0, 5));
        return result;
    },

    /**
     * Create analysis prompt
     * @param {string} templateCSV - Programme template in CSV format
     * @param {string} transcriptContent - Student transcript content (for text files)
     * @param {string} programmeName - Programme name  
     * @param {number} fileCount - Number of files being processed
     * @returns {string} Complete prompt
     */
    createPrompt(templateCSV, transcriptContent, programmeName, fileCount = 1) {
        const fileTypeText = fileCount > 0 && transcriptContent === '' ? 
            'PDF transcript files' : 
            'student transcript content';

        return `
HKIT Course Exemption Analysis - ${programmeName}

TEMPLATE COURSES:
${templateCSV}

${transcriptContent ? `STUDENT TRANSCRIPTS:\n${transcriptContent}\n` : ''}

TASK:
Analyze the ${fileTypeText} and determine exemption eligibility for each course in the template based on the student's academic history.

EXEMPTION CRITERIA:
- Skills-Based Matching: Focus on transferable competencies (critical thinking, problem-solving, communication, leadership, analysis) rather than course titles
- Language Exemptions: Grant HD401/HD402/HC401/BA50084E for ANY completed English courses; HD405 for ANY Chinese courses
- Content Examples: "Critical Thinking" → "Employability Skills", "Economics" → "Analysis of Real World Issues", "Communication" → "Presentation Skills"
- Max 50% total exemptions per programme
- Grade: Pass (50%+) or D+ equivalent
- Prioritize practical skills alignment over exact name matching

OUTPUT FORMAT (JSON array only, no other text):
[
  {
    "HKIT Subject Code": "[exact code from template]",
    "HKIT Subject Name": "[exact name from template]",
    "Exemption Granted / study plan": "Exempted" OR "",
    "Subject Name of Previous Studies": "[previous course name]" OR "",
    "Exemption Granted": "TRUE" OR "FALSE",
    "Remarks": "[one sentence explanation]"
  }
]

IMPORTANT RULES:
- Use exact course codes and names from template
- "Exempted" for exemptions, empty string "" for non-exemptions
- Include specific previous course names if exemption granted
- Provide clear one-sentence explanation in remarks
- Output ONLY valid JSON array, no markdown formatting or additional text
- Process ALL courses in the template
`;
    },

    /**
     * Convert ArrayBuffer to Base64 safely (fixes stack overflow)
     * @param {ArrayBuffer} buffer - File buffer
     * @returns {string} Base64 encoded string
     */
    arrayBufferToBase64(buffer) {
        try {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            
            // Process in chunks to avoid stack overflow
            const chunkSize = 8192; // 8KB chunks
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.slice(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, chunk);
            }
            
            return btoa(binary);
        } catch (error) {
            console.error('Base64 conversion error:', error);
            throw new Error('Failed to convert file to base64');
        }
    },

    /**
     * Call Gemini API through Vercel Function (安全版本)
     * @param {string} prompt - Analysis prompt
     * @param {Array} files - Array of file objects  
     * @returns {Promise<Object>} API response
     */
    async callAPI(prompt, files = []) {
        try {
            // Check if we're in local mode
            const isLocalMode = window.API_CONFIG && window.API_CONFIG.LOCAL_MODE;
            
            if (isLocalMode) {
                console.log('📡 Calling Gemini API directly (Local Mode)...');
                return await this.callLocalAPI(prompt, files);
            } else {
                console.log('📡 Calling Vercel Function API...');
                return await this.callVercelAPI(prompt, files);
            }
            
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    /**
     * Call Gemini API directly (Local Mode)
     */
    async callLocalAPI(prompt, files = []) {
        console.log('📍 callLocalAPI called with:', { promptLength: prompt.length, filesCount: files.length });
        
        // Check API key availability
        if (!window.API_CONFIG || !window.API_CONFIG.getApiKey()) {
            throw new Error('API key not configured. Please enter your Gemini API key first.');
        }
        
        const apiKey = window.API_CONFIG.getApiKey();
        console.log('📍 Using API key:', apiKey.substring(0, 10) + '...');
        
        // Process files if any
        const processedFiles = await this.processFilesForLocal(files);
        console.log('📍 Processed files:', processedFiles.length);
        
        // Make direct API call via OpenRouter (using Gemini 2.5 Pro)
        console.log('📍 Using OpenRouter with Gemini 2.5 Pro for optimal performance...');
        return await this.makeDirectOpenRouterCall(prompt, processedFiles, apiKey);
    },

    /**
     * Make direct call to OpenRouter API (using Gemini 2.5 Pro)
     */
    async makeDirectOpenRouterCall(prompt, files, apiKey) {
        const url = 'https://openrouter.ai/api/v1/chat/completions';

        console.log('📍 Using OpenRouter with model: google/gemini-2.5-pro');

        // Build messages array for OpenRouter
        const messages = [{ role: 'user', content: [{ type: 'text', text: prompt }] }];

        // Add files if present
        if (files && files.length > 0) {
            files.forEach(f => {
                if (f.mimeType && f.data) {
                    messages[0].content.push({
                        type: 'image_url',
                        image_url: { url: `data:${f.mimeType};base64,${f.data}` }
                    });
                }
            });
        }

        console.log('📍 Making OpenRouter API call...');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'HKIT Course Analyzer'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.5-pro',
                    messages,
                    temperature: 0.3,
                    max_tokens: 16384,
                    top_p: 0.9,
                    top_k: 40
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('📍 Received response from OpenRouter');
            console.log('📍 Response structure:', JSON.stringify(data, null, 2));

            // Extract response text from OpenRouter format
            const text = data.choices[0].message.content;

            console.log('📍 Extracted text length:', text.length);
            return {
                success: true,
                data: { text: text }
            };

        } catch (error) {
            console.error('OpenRouter API call failed:', error);
            throw error;
        }
    },

    /**
     * Process files for local API calls
     */
    async processFilesForLocal(files) {
        const processedFiles = [];
        
        for (const fileObj of files) {
            if (fileObj.file.type === 'application/pdf') {
                try {
                    console.log(`Processing PDF: ${fileObj.name} (${fileObj.file.size} bytes)`);
                    
                    // Check file size limit
                    if (fileObj.file.size > 20 * 1024 * 1024) {
                        throw new Error(`PDF file too large: ${fileObj.name}. Maximum size is 20MB.`);
                    }

                    // Use cached arrayBuffer if available, otherwise read and cache it
                    if (!fileObj.arrayBuffer) {
                        console.log(`Reading ArrayBuffer from File object: ${fileObj.name}`);
                        fileObj.arrayBuffer = await fileObj.file.arrayBuffer();
                        console.log(`ArrayBuffer cached for: ${fileObj.name}`);
                    } else {
                        console.log(`Using cached ArrayBuffer for: ${fileObj.name}`);
                    }

                    const base64Data = this.arrayBufferToBase64(fileObj.arrayBuffer);
                    
                    processedFiles.push({
                        name: fileObj.name,
                        mimeType: 'application/pdf',
                        data: base64Data
                    });
                    
                    console.log(`✅ PDF processed successfully: ${fileObj.name}`);
                } catch (error) {
                    console.error('Error processing PDF file:', error);
                    throw new Error(`Failed to process PDF file: ${fileObj.name} - ${error.message}`);
                }
            }
        }
        
        return processedFiles;
    },

    /**
     * Call Gemini API through Vercel Function (Production Mode)
     */
    async callVercelAPI(prompt, files = []) {
        try {
            // For image-based PDFs, check if we need to bypass Vercel
            if (files.length > 0) {
                const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
                const estimatedBase64Size = totalSize * 1.33;
                const vercelLimit = 4.5 * 1024 * 1024; // 4.5MB

                if (estimatedBase64Size > vercelLimit) {
                    console.log('⚠️ PDF too large for Vercel (image-based PDF detected)');
                    console.log(`📊 File size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
                    console.log(`📊 Estimated base64: ${(estimatedBase64Size / 1024 / 1024).toFixed(2)}MB`);
                    console.log('🚀 Using Gemini Files API for large file (secure server-side upload)...');

                    // Upload file to Gemini Files API via server
                    const uploadResult = await this.uploadToFilesAPI(files[0]);

                    if (!uploadResult.success || !uploadResult.file) {
                        throw new Error('Failed to upload file to Gemini Files API');
                    }

                    console.log(`✅ File uploaded successfully: ${uploadResult.file.name}`);
                    console.log(`📍 File URI: ${uploadResult.file.uri}`);

                    // Analyze using uploaded file reference
                    return await this.analyzeWithFileReference(prompt, uploadResult.file);
                }
            }

            // For small files or no files, use Vercel
            console.log('📡 Using Vercel API (file size within limits)');

            const requestData = {
                prompt: prompt,
                model: 'gemini-2.5-pro',
                maxTokens: 16384
            };

            // Send files through Vercel (small enough to fit)
            if (files.length > 0) {
                requestData.files = [];

                for (const fileObj of files) {
                    if (fileObj.file.type === 'application/pdf') {
                        console.log(`Processing PDF: ${fileObj.name} (${fileObj.file.size} bytes)`);
                        const arrayBuffer = await fileObj.file.arrayBuffer();
                        const base64Data = this.arrayBufferToBase64(arrayBuffer);

                        requestData.files.push({
                            name: fileObj.name,
                            mimeType: 'application/pdf',
                            data: base64Data
                        });
                    }
                }
            }

            // 调用我们的安全Vercel Function
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Vercel Function Error:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            console.log('✅ Received response from Vercel Function');
            return await response.json();
            
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    /**
     * Upload file to Gemini Files API via server
     * @param {Object} fileObj - File object with file property
     * @returns {Promise<Object>} Upload result with file metadata
     */
    async uploadToFilesAPI(fileObj) {
        try {
            console.log(`📤 Uploading ${fileObj.name} to Gemini Files API...`);

            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('file', fileObj.file, fileObj.name);

            // Upload to server endpoint
            const response = await fetch('/api/gemini-upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Upload failed with status:', response.status);
                console.error('❌ Error details:', errorData);
                throw new Error(errorData.details || errorData.error || 'Upload failed');
            }

            const result = await response.json();
            console.log(`✅ Upload complete: ${result.file.name}`);
            console.log(`📍 File URI: ${result.file.uri}`);

            return result;

        } catch (error) {
            console.error('❌ File upload error:', error);
            console.error('Error message:', error.message);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    },

    /**
     * Analyze transcript with uploaded file reference
     * @param {string} prompt - Analysis prompt
     * @param {Object} fileMetadata - Uploaded file metadata (uri, name, etc.)
     * @returns {Promise<Object>} Analysis response
     */
    async analyzeWithFileReference(prompt, fileMetadata) {
        try {
            console.log(`🔍 Analyzing with file reference: ${fileMetadata.name}`);

            // Call analysis endpoint with file data (base64)
            const response = await fetch('/api/gemini-analyze-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    fileData: fileMetadata.data || fileMetadata.uri, // Support both new (data) and old (uri) format
                    fileName: fileMetadata.name,
                    mimeType: fileMetadata.mimeType || 'application/pdf',
                    model: 'gemini-2.5-pro',
                    maxTokens: 16384
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Analysis failed');
            }

            const result = await response.json();
            console.log(`✅ Analysis complete`);

            return result;

        } catch (error) {
            console.error('File analysis error:', error);
            throw new Error(`Failed to analyze file: ${error.message}`);
        }
    },

    /**
     * Parse Gemini response
     * @param {Object} response - Raw API response
     * @returns {Array} Parsed analysis results
     */
    parseResponse(response) {
        try {
            console.log('📍 Parsing response:', response);
            console.log('📍 Response keys:', Object.keys(response));
            console.log('📍 response.success:', response.success);
            console.log('📍 response.data:', response.data);
            console.log('📍 response.data keys:', response.data ? Object.keys(response.data) : 'N/A');

            // Extract text from response (handle OpenRouter, Vercel function, and direct Gemini formats)
            let text;
            if (response.choices && response.choices[0] && response.choices[0].message) {
                // OpenRouter format (check FIRST)
                console.log('📍 Using OpenRouter format');
                text = response.choices[0].message.content;
            } else if (response.success && response.data && response.data.text) {
                // Vercel function format
                console.log('📍 Using Vercel function format');
                text = response.data.text;
            } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                // Direct Gemini response format
                console.log('📍 Using direct Gemini format');
                text = response.candidates[0].content.parts[0].text;
            } else {
                console.error('📍 Could not match any response format!');
                console.error('📍 response.success:', response.success);
                console.error('📍 response.data:', response.data);
                console.error('📍 response.candidates:', response.candidates);
                console.error('📍 response.choices:', response.choices);
                throw new Error('Invalid API response structure');
            }
            
            // const text = response.candidates[0].content.parts[0].text;

            console.log('📍 Raw text from API (first 500 chars):', text.substring(0, 500));
            console.log('📍 Raw text from API (last 500 chars):', text.substring(Math.max(0, text.length - 500)));
            console.log('📍 Total text length:', text.length);

            // Clean up response (remove markdown code blocks if present)
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            console.log('📍 Cleaned text (first 500 chars):', cleanText.substring(0, 500));
            console.log('📍 Cleaned text (last 500 chars):', cleanText.substring(Math.max(0, cleanText.length - 500)));

            // Parse JSON with better error handling
            let results;
            try {
                results = JSON.parse(cleanText);
            } catch (parseError) {
                console.error('📍 JSON Parse Error:', parseError.message);
                console.error('📍 Full cleaned text:', cleanText);
                throw parseError;
            }
            
            // Validate results
            if (!Array.isArray(results)) {
                throw new Error('Invalid response format: expected array');
            }

            // Validate each result has required fields
            const requiredFields = [
                'HKIT Subject Code',
                'HKIT Subject Name',
                'Exemption Granted / study plan',
                'Subject Name of Previous Studies',
                'Exemption Granted',
                'Remarks'
            ];

            results.forEach((result, index) => {
                requiredFields.forEach(field => {
                    if (!(field in result)) {
                        throw new Error(`Missing field "${field}" in result ${index + 1}`);
                    }
                });
            });

            console.log(`✅ Parsed ${results.length} course results`);
            return results;
        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            console.error('Raw response:', response);
            throw new Error('Failed to parse analysis results. Please try again.');
        }
    }
};

// Export GeminiAPI to global scope
window.GeminiAPI = GeminiAPI;