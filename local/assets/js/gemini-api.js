/**
 * Gemini API Integration - 安全版本  
 * 通过Vercel Functions调用，不暴露API密钥
 * Enhanced with Learning Database System
 */

// Learning Engine Integration (with fallback if not available)
let LearningEngine = null;
try {
    if (typeof require !== 'undefined') {
        LearningEngine = require('./db/learning-engine');
    }
} catch (error) {
    console.log('🧠 Learning engine not available:', error.message);
}

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
                
                // Process with smart pattern matcher
                smartResult = await window.SmartPatternMatcher.processWithPatterns(
                    extractedSubjects, 
                    learningPatterns, 
                    programme
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

                // Call Gemini API
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

        // LEARNING RECORDING: Record results for future learning (if not using smart matcher)
        if (!smartResult && typeof window !== 'undefined' && window.learningClient && finalResults) {
            try {
                await window.learningClient.recordAnalysisResults(finalResults, programme.code);
                console.log('📊 Recorded analysis results for learning');
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
Analyze the ${fileTypeText} and determine exemption eligibility for each course in the template based on the student's academic history. For each HKIT course, identify the most relevant course from the student's transcript (whether exempted or not) to help with future analysis.

EXEMPTION CRITERIA:
- Exact Name Matching: Use ONLY the exact course names as they appear in the transcript - DO NOT paraphrase or interpret
- Language Exemptions: Grant HD401/HD402/HC401/BA50084E for ANY completed English courses; HD405 for ANY Chinese courses
- Grade Requirements: Pass (50%+) or D+ equivalent
- Max 50% total exemptions per programme
- When no exact match exists, use closest matching course name from transcript
- DO NOT create interpreted or summarized course names

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
- ALWAYS include the most relevant previous course name from the transcript for each HKIT course, regardless of exemption status
- Use EXACT course names from transcript - DO NOT paraphrase, summarize, or interpret subject names
- Copy course names EXACTLY as they appear in the original transcript text
- If no relevant previous course exists, leave "Subject Name of Previous Studies" as empty string
- Provide clear one-sentence explanation in remarks
- Output ONLY valid JSON array, no markdown formatting or additional text
- Process ALL courses in the template
`;
    },

    /**
     * Stage 1: Extract ALL subjects from transcript (WITHOUT analysis)
     * @param {string} transcriptText - Raw transcript content (for text files)
     * @param {Array} files - File objects (for PDF files)
     * @returns {Promise<Array>} Array of subject names
     */
    async extractSubjectsOnly(transcriptText, files = []) {
        // Handle PDF files if provided
        if (files && files.length > 0) {
            const pdfFiles = files.filter(f => f.file.type === 'application/pdf');
            if (pdfFiles.length > 0) {
                console.log('🔍 Stage 1: Processing PDF files for subject extraction...');
                try {
                    // Use simple extraction prompt for PDF
                    const extractionPrompt = `Extract EVERY course/subject name from this academic transcript. Return ONLY a JSON array of course names: ["Course 1", "Course 2", ...]`;
                    const response = await this.callAPI(extractionPrompt, pdfFiles);
                    
                    if (response && response.data && response.data.text) {
                        const subjects = this.parseSubjectsFromResponse(response.data.text);
                        console.log(`✅ Stage 1 PDF extraction: Found ${subjects.length} subjects`);
                        
                        // Add to SubjectCollector
                        if (typeof SubjectCollector !== 'undefined' && subjects.length > 0) {
                            SubjectCollector.addBulkSubjects(subjects);
                        }
                        
                        return subjects;
                    }
                } catch (error) {
                    console.warn('📄 PDF extraction failed, using fallback:', error);
                }
            }
        }

        // Handle text content
        if (!transcriptText || typeof transcriptText !== 'string') {
            return [];
        }

        const extractionPrompt = `
CRITICAL EXTRACTION TASK: You MUST extract EVERY SINGLE course/subject name from this transcript.

TRANSCRIPT CONTENT:
${transcriptText}

MANDATORY REQUIREMENTS:
1. Extract EVERY course name you can find - do NOT skip any
2. Include ALL courses regardless of grades (A+, B, C, F, Pass, Fail)
3. Include courses with ANY status (completed, in-progress, failed)
4. Use the EXACT name as it appears - do NOT change words
5. Extract from ANY format: tables, lists, bullet points, paragraphs
6. Count the courses in the transcript first, then extract that many
7. Do NOT analyze, map, or interpret - just extract ALL names
8. Do NOT filter based on relevance - include EVERYTHING

CRITICAL: If you see 15 courses in the transcript, you MUST return 15 course names.

EXAMPLES of what to extract:
✓ "English and Communication: Workplace Interaction" → "English and Communication: Workplace Interaction"  
✓ "Information Technology Essentials - Services" → "Information Technology Essentials - Services"
✓ "Law and Ethics for the Hospitality Industry" → "Law and Ethics for the Hospitality Industry"

OUTPUT FORMAT:
Return ONLY a JSON array with ALL course names found:
["Course Name 1", "Course Name 2", "Course Name 3", ...]

VERIFICATION: Count the courses in the transcript above. Your JSON array MUST contain that exact number of course names.
`;

        try {
            console.log('🔍 Stage 1: Extracting subjects from transcript...');
            
            // Skip API for now - use fallback directly for text content
            if (transcriptText) {
                console.log('🔄 Using direct parsing for text (API hanging)...');
                if (typeof SubjectCollector !== 'undefined') {
                    const extractedCount = SubjectCollector.extractFromTranscript(transcriptText);
                    const subjects = SubjectCollector.getAllSubjects();
                    console.log(`✅ Direct text parsing extracted ${subjects.length} subjects`);
                    return subjects;
                }
            }
            
            const response = await this.callAPI(extractionPrompt, []);
            
            // Parse the JSON response
            let subjects = [];
            try {
                // Clean the response to ensure it's valid JSON
                let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                subjects = JSON.parse(cleanResponse);
                
                if (!Array.isArray(subjects)) {
                    throw new Error('Response is not an array');
                }
            } catch (parseError) {
                console.warn('Failed to parse JSON response, attempting fallback parsing:', parseError);
                
                // Fallback: Extract subject names from any format
                const lines = response.split('\n');
                subjects = [];
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && 
                        !trimmed.startsWith('{') && 
                        !trimmed.startsWith('[') && 
                        !trimmed.startsWith('"[') &&
                        !trimmed.includes('TRANSCRIPT') &&
                        !trimmed.includes('INSTRUCTIONS') &&
                        trimmed.length > 5) {
                        
                        // Remove quotes and clean up
                        const cleaned = trimmed.replace(/^["']|["']$/g, '').replace(/,$/, '');
                        if (cleaned && cleaned.length > 5) {
                            subjects.push(cleaned);
                        }
                    }
                }
            }
            
            // Clean and validate subjects
            const cleanedSubjects = subjects
                .map(subject => this.cleanSubjectName(subject))
                .filter(subject => subject && this.isValidSubjectName(subject))
                .filter((subject, index, arr) => arr.indexOf(subject) === index); // Remove duplicates
            
            console.log(`✅ Stage 1 Gemini extraction: Found ${cleanedSubjects.length} subjects`);
            console.log('📋 Gemini extracted subjects:', cleanedSubjects);
            
            // HYBRID APPROACH: If Gemini didn't extract enough, supplement with direct parsing
            let finalSubjects = [...cleanedSubjects];
            
            if (typeof SubjectCollector !== 'undefined') {
                // Always try direct parsing as well
                console.log('🔍 Running direct parsing as supplement...');
                const directCount = SubjectCollector.extractFromTranscript(transcriptText);
                const directSubjects = SubjectCollector.getAllSubjects();
                
                console.log(`🔍 Direct parsing found ${directCount} new subjects`);
                
                // Merge results, avoiding duplicates
                directSubjects.forEach(subject => {
                    if (!finalSubjects.some(existing => 
                        existing.toLowerCase().trim() === subject.toLowerCase().trim()
                    )) {
                        finalSubjects.push(subject);
                    }
                });
                
                console.log(`🎯 HYBRID RESULT: ${finalSubjects.length} total subjects (${cleanedSubjects.length} from Gemini + ${finalSubjects.length - cleanedSubjects.length} from direct parsing)`);
                
                // Add all subjects to SubjectCollector
                if (finalSubjects.length > cleanedSubjects.length) {
                    SubjectCollector.addBulkSubjects(finalSubjects);
                } else if (cleanedSubjects.length > 0) {
                    SubjectCollector.addBulkSubjects(cleanedSubjects);
                }
            } else {
                // Fallback if SubjectCollector not available
                finalSubjects = cleanedSubjects;
            }
            
            // LEARNING CONTEXT: Gather learning patterns for these subjects (non-blocking)
            if (LearningEngine && finalSubjects.length > 0) {
                try {
                    // Extract programme context if available (would need programmeId parameter)
                    LearningEngine.gatherLearningContext(finalSubjects, null)
                        .catch(error => console.warn('Learning context gathering failed:', error));
                } catch (error) {
                    console.warn('Learning context initialization failed:', error);
                }
            }
            
            return finalSubjects;
            
        } catch (error) {
            console.error('❌ Stage 1 extraction failed:', error);
            
            // Fallback: Use direct parsing as backup
            console.log('🔄 Falling back to direct transcript parsing...');
            if (typeof SubjectCollector !== 'undefined') {
                const extractedCount = SubjectCollector.extractFromTranscript(transcriptText);
                const fallbackSubjects = SubjectCollector.getAllSubjects();
                console.log(`🔄 Fallback extracted ${extractedCount} subjects`);
                return fallbackSubjects;
            }
            
            return [];
        }
    },

    /**
     * Clean subject name for consistency
     * @param {string} subjectName - Raw subject name
     * @returns {string} Cleaned subject name
     */
    cleanSubjectName(subjectName) {
        if (!subjectName || typeof subjectName !== 'string') return '';
        
        return subjectName
            .trim()
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/[""'']/g, '"')  // Normalize quotes
            .replace(/\.$/, '')  // Remove trailing period
            .replace(/^-\s*/, '')  // Remove leading dash
            .replace(/^\d+\.\s*/, ''); // Remove leading numbers like "1. "
    },

    /**
     * Validate if extracted text is a valid subject name
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
            'Phone', 'Email', 'Website', 'Page', 'Continued', 'End of',
            'TASK:', 'INSTRUCTIONS:', 'OUTPUT FORMAT:', 'EXAMPLE:'
        ];
        
        if (blacklist.some(item => subjectName.includes(item))) return false;
        
        // Must contain at least one alphabetic word longer than 2 characters
        const hasValidWord = /\b[A-Za-z]{3,}\b/.test(subjectName);
        
        // Should not be mostly numbers or symbols
        const alphaRatio = (subjectName.match(/[A-Za-z]/g) || []).length / subjectName.length;
        
        return hasValidWord && alphaRatio > 0.5;
    },

    /**
     * Parse subjects from API response text
     * @param {string} responseText - Response from API
     * @returns {Array} Array of subject names
     */
    parseSubjectsFromResponse(responseText) {
        let subjects = [];
        
        try {
            // Clean the response to extract JSON
            let cleanResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            subjects = JSON.parse(cleanResponse);
            
            if (Array.isArray(subjects)) {
                return subjects.map(s => this.cleanSubjectName(s)).filter(s => s && this.isValidSubjectName(s));
            }
        } catch (parseError) {
            // Fallback: Extract from any format
            console.warn('JSON parse failed, trying text extraction:', parseError);
            const lines = responseText.split('\n');
            subjects = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && 
                    trimmed.length > 5 && 
                    !trimmed.includes('Course') && 
                    !trimmed.includes('```') &&
                    /^[A-Z]/.test(trimmed)) {
                    
                    // Remove quotes and clean up
                    const cleaned = trimmed.replace(/^["']|["']$/g, '').replace(/,$/, '');
                    if (cleaned && this.isValidSubjectName(cleaned)) {
                        subjects.push(cleaned);
                    }
                }
            }
        }
        
        return subjects;
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
     * Call Gemini API via Backend Server (Secure - No API key needed from user)
     */
    async callLocalAPI(prompt, files = []) {
        console.log('📍 callLocalAPI called with:', { promptLength: prompt.length, filesCount: files.length });

        // Process files if any
        const processedFiles = await this.processFilesForLocal(files);
        console.log('📍 Processed files:', processedFiles.length);

        // Call backend API server (API key stored server-side)
        const backendUrl = 'http://localhost:3001/api/gemini';

        console.log('📍 Calling backend server at:', backendUrl);

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: 'gemini-2.5-flash',
                    files: processedFiles,
                    temperature: 0.3,
                    maxTokens: 8192
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Backend API call failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Backend API returned unsuccessful response');
            }

            console.log('✅ Backend API call successful');

            // Return in expected format
            return {
                data: {
                    text: data.data.text,
                    model: data.data.model
                }
            };

        } catch (error) {
            console.error('❌ Backend API call failed:', error);

            // Provide helpful error messages
            if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
                throw new Error('Cannot connect to backend server. Please make sure the server is running on port 3001.');
            }

            throw error;
        }
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
                model: 'gemini-1.5-pro'  // Optimized for speed and reliability
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

            // Validate extracted subjects for potential hallucinations
            this.validateExtractedSubjects(results);
            
            console.log(`✅ Parsed ${results.length} course results`);
            return results;
        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            console.error('Raw response:', response);
            throw new Error('Failed to parse analysis results. Please try again.');
        }
    },

    /**
     * Validate extracted subjects for potential hallucinations
     * @param {Array} results - Parsed analysis results
     */
    validateExtractedSubjects(results) {
        const extractedSubjects = results
            .map(r => r['Subject Name of Previous Studies'])
            .filter(subject => subject && subject.trim() !== '');

        // Log potential issues for debugging
        const suspiciousSubjects = extractedSubjects.filter(subject => {
            // Check for common signs of interpretation rather than exact extraction
            const suspicious = 
                subject.includes('→') || // Mapping indicators
                subject.includes('equivalent') ||
                subject.includes('similar to') ||
                subject.toLowerCase().includes('skills') && !subject.toLowerCase().includes('skills') || // Generic skills terms
                subject.length < 5 || // Very short names might be interpreted
                /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(subject) && subject.split(' ').length === 2; // Generic two-word patterns
            
            return suspicious;
        });

        if (suspiciousSubjects.length > 0) {
            console.warn('⚠️ Potentially interpreted subject names detected:', suspiciousSubjects);
            console.warn('These subjects may not be exact matches from the transcript.');
            
            // Show user notification about potential hallucinations
            if (typeof NotificationManager !== 'undefined') {
                const subjectList = suspiciousSubjects.length > 3 
                    ? suspiciousSubjects.slice(0, 3).join(', ') + `... (and ${suspiciousSubjects.length - 3} more)`
                    : suspiciousSubjects.join(', ');
                
                NotificationManager.warning(
                    `⚠️ Potential hallucination detected: ${suspiciousSubjects.length} subject(s) may not match your transcript exactly: ${subjectList}. Please review and edit if needed.`,
                    8000 // Longer duration for important warnings
                );
            }
            
            // Debug logging
            if (typeof DebugMonitor !== 'undefined') {
                DebugMonitor.logActivity(`⚠️ ${suspiciousSubjects.length} potentially hallucinated subjects detected`, 'warning');
                suspiciousSubjects.forEach(subject => {
                    DebugMonitor.logActivity(`   • "${subject}"`, 'warning');
                });
            }
        }

        // Show success notification about subject extraction
        if (typeof NotificationManager !== 'undefined' && extractedSubjects.length > 0) {
            const exemptionCount = results.filter(r => r['Exemption Granted'] === 'TRUE').length;
            NotificationManager.success(
                `✅ Extracted ${extractedSubjects.length} subjects from your transcript (${exemptionCount} potential exemptions)`,
                4000
            );
        }

        // Log all extracted subjects for user reference
        console.log('📋 All extracted subjects:', extractedSubjects);
        
        // Debug logging for all subjects
        if (typeof DebugMonitor !== 'undefined') {
            DebugMonitor.logActivity(`📋 Extracted ${extractedSubjects.length} subjects from transcript`, 'info');
        }
    }
};

// Export GeminiAPI to global scope
window.GeminiAPI = GeminiAPI;