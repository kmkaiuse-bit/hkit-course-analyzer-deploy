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
        // No API key validation needed for Vercel Functions
        console.log('🚀 Starting analysis with Vercel Functions...');

        // Get programme template
        const programme = TemplateManager.getProgramme(programmeId);
        if (!programme) {
            throw new Error('Invalid programme selected');
        }

        // Generate template CSV for prompt
        const templateCSV = TemplateManager.generateTemplateCSV(programmeId);
        
        // Create prompt
        const prompt = this.createPrompt(templateCSV, transcriptContent, programme.name, files.length);

        // Call API with appropriate content
        try {
            const response = await this.callAPI(prompt, files);
            return this.parseResponse(response);
        } catch (error) {
            console.error('Gemini API error:', error);
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
            throw new Error(`Failed to analyze transcripts: ${error.message}`);
        }
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
        
        // Make direct API call with Gemini 1.5 Pro (optimized for speed and reliability)
        console.log('📍 Using Gemini 1.5 Pro for optimal performance...');
        return await this.makeDirectGeminiCall(prompt, processedFiles, apiKey);
    },

    /**
     * Make direct call to Gemini API
     */
    async makeDirectGeminiCall(prompt, files, apiKey) {
        const modelName = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
        
        console.log('📍 Using model:', modelName);
        
        // Prepare request body
        let requestBody;
        if (files && files.length > 0) {
            const parts = [{ text: prompt }];
            files.forEach(file => {
                if (file.mimeType === 'application/pdf') {
                    parts.push({
                        inlineData: {
                            mimeType: file.mimeType,
                            data: file.data
                        }
                    });
                }
            });
            requestBody = {
                contents: [{ parts: parts }],
                generationConfig: {
                    temperature: 0.3,  // Lower for more consistent academic analysis
                    maxOutputTokens: 8192,
                    topP: 0.9,  // Slightly more focused
                    topK: 40
                }
            };
        } else {
            requestBody = {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.3,  // Lower for more consistent academic analysis
                    maxOutputTokens: 8192,
                    topP: 0.9,  // Slightly more focused
                    topK: 40
                }
            };
        }

        console.log('📍 Making direct API call to:', url.split('?')[0]);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('📍 Received response from Gemini API');
            console.log('📍 Response structure:', JSON.stringify(data, null, 2));
            
            // Extract response text from standard Gemini format
            let text = null;
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const candidate = data.candidates[0];
                console.log('📍 Successfully received response from Gemini 1.5 Pro');
                
                if (candidate.content.parts[0] && candidate.content.parts[0].text) {
                    text = candidate.content.parts[0].text;
                }
            }
            
            if (text) {
                console.log('📍 Extracted text length:', text.length);
                return {
                    success: true,
                    data: { text: text }
                };
            } else {
                console.error('📍 Could not find text in response:', data);
                console.error('📍 Full response keys:', Object.keys(data));
                if (data.candidates) {
                    console.error('📍 Candidate keys:', Object.keys(data.candidates[0] || {}));
                }
                
                // Try to extract any text-like content
                const responseStr = JSON.stringify(data);
                console.error('📍 Full response as string:', responseStr);
                
                throw new Error('Could not extract text from Gemini API response. Check console for details.');
            }
        } catch (error) {
            console.error('Direct Gemini API call failed:', error);
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
                    
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const base64Data = this.arrayBufferToBase64(arrayBuffer);
                    
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
            
            // 构建请求数据
            const requestData = {
                prompt: prompt,
                model: 'gemini-2.5-flash'  // Latest model with improved performance
            };

            // 如果有PDF文件，处理成base64
            if (files.length > 0) {
                requestData.files = [];
                
                for (const fileObj of files) {
                    if (fileObj.file.type === 'application/pdf') {
                        try {
                            console.log(`Processing PDF: ${fileObj.name} (${fileObj.file.size} bytes)`);
                            
                            // Check file size limit (Gemini has ~20MB limit for files)
                            if (fileObj.file.size > 20 * 1024 * 1024) {
                                throw new Error(`PDF file too large: ${fileObj.name}. Maximum size is 20MB.`);
                            }
                            
                            const arrayBuffer = await fileObj.file.arrayBuffer();
                            const base64Data = this.arrayBufferToBase64(arrayBuffer);
                            
                            requestData.files.push({
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
     * Parse Gemini response
     * @param {Object} response - Raw API response
     * @returns {Array} Parsed analysis results
     */
    parseResponse(response) {
        try {
            console.log('📍 Parsing response:', response);
            // Extract text from response (handle both Vercel function and direct Gemini formats)
            let text;
            if (response.success && response.data && response.data.text) {
                // Vercel function format
                text = response.data.text;
            } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                // Direct Gemini response format
                text = response.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid API response structure');
            }
            
            // const text = response.candidates[0].content.parts[0].text;
            
            // Clean up response (remove markdown code blocks if present)
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            // Parse JSON
            const results = JSON.parse(cleanText);
            
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