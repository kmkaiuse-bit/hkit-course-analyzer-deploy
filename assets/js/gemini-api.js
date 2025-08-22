/**
 * Gemini API Integration - Fixed Stack Overflow Issue
 * Handles both text files and PDF files directly
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
        // Validate API configuration
        if (!validateConfig()) {
            throw new Error('Gemini API key not configured. Please add your API key in config/api-config.js');
        }

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
            throw new Error('Failed to analyze transcripts. Please try again.');
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
- Course content similarity :Base the analysis on the direct content overlap between the completed courses and the target courses.
- total percentange number of Exemptions Granted must not be more than 50% of the total number of subjects in the course
-Pass or higher (50+ points) or equivalent
- Special Language Rule: If the student's record shows completion of any university-level English and Chinese courses, exemptions for HD401 (Academic English), HD402 (English for Communication), and HD405 (Practical Chinese) must be automatically granted.
- Possibility Assessment: If an exemption is determined to be "possible" or "highly possible," it is to be treated as granted.
- Sufficient credit hours
- Prerequisite requirements met

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
     * Call Gemini API with support for both text and PDF files
     * @param {string} prompt - Analysis prompt
     * @param {Array} files - Array of file objects
     * @returns {Promise<Object>} API response
     */
    async callAPI(prompt, files = []) {
        try {
            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }],
                generationConfig: {
                    temperature: API_CONFIG.gemini.temperature,
                    maxOutputTokens: API_CONFIG.gemini.maxTokens
                }
            };

            // Add PDF files directly to the request
            if (files.length > 0) {
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
                            
                            requestBody.contents[0].parts.push({
                                inline_data: {
                                    mime_type: "application/pdf",
                                    data: base64Data
                                }
                            });
                            
                            console.log(`✅ PDF processed successfully: ${fileObj.name}`);
                        } catch (error) {
                            console.error('Error processing PDF file:', error);
                            throw new Error(`Failed to process PDF file: ${fileObj.name} - ${error.message}`);
                        }
                    }
                }
            }

            console.log('Sending request to Gemini API...');
            const response = await fetch(getGeminiEndpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            console.log('✅ Received response from Gemini API');
            return response.json();
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
            // Extract text from Gemini response
            if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
                throw new Error('Invalid API response structure');
            }

            const text = response.candidates[0].content.parts[0].text;
            
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
