/**
 * Gemini API Integration - Simple Local Version
 */

const GeminiAPI = {
    async analyzeTranscripts(transcriptContent, programmeId, files = []) {
        if (!API_CONFIG.isValidated) {
            throw new Error('API key not configured. Please set up your Gemini API key.');
        }

        const programme = TemplateManager.getProgramme(programmeId);
        if (!programme) {
            throw new Error('Invalid programme selected');
        }

        const templateCSV = TemplateManager.generateTemplateCSV(programmeId);
        const prompt = this.createPrompt(templateCSV, transcriptContent, programme.name);

        try {
            const response = await API_CONFIG.callGeminiAPI(prompt, files);
            return this.parseResponse(response);
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error('Failed to analyze transcripts. Please try again.');
        }
    },

    createPrompt(templateCSV, transcriptContent, programmeName) {
        return `
HKIT Course Exemption Analysis - ${programmeName}

TEMPLATE COURSES:
${templateCSV}

STUDENT TRANSCRIPTS:
${transcriptContent}

TASK:
Analyze the student transcripts and determine exemption eligibility for each course in the template.

EXEMPTION CRITERIA:
- Course content similarity
- Pass grade (50+ points or Grade D or above)
- Special Language Rule: Grant HD401/HD402 exemptions for ANY English course, HD405 for ANY Chinese course
- Maximum 50% exemptions allowed

OUTPUT FORMAT (JSON array only, no markdown):
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

Return ONLY the JSON array, no other text.
`;
    },

    parseResponse(response) {
        try {
            let text;
            if (response.success && response.data && response.data.text) {
                text = response.data.text;
            } else {
                throw new Error('Invalid API response structure');
            }
            
            // Clean up response
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            // Parse JSON
            const results = JSON.parse(cleanText);
            
            if (!Array.isArray(results)) {
                throw new Error('Expected array response');
            }

            console.log(`✅ Parsed ${results.length} course results`);
            return results;
        } catch (error) {
            console.error('Error parsing response:', error);
            throw new Error('Failed to parse analysis results. Please try again.');
        }
    }
};

window.GeminiAPI = GeminiAPI;
