const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in environment variables'
      });
    }

    // Parse request body
    const { prompt, model = 'gemini-1.5-flash', temperature = 0.7, maxTokens = 4096, files = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }

    console.log('Initializing Gemini API...');
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use a faster model for better performance
    const geminiModel = genAI.getGenerativeModel({ 
      model: model,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: Math.min(maxTokens, 8192), // Limit to prevent timeouts
        topP: 0.95,
        topK: 40,
      },
    });

    console.log('Generating content...');
    
    // Prepare content for generation (handle files if present)
    let contentToGenerate;
    if (files && files.length > 0) {
      // Handle files with prompt
      const parts = [{ text: prompt }];
      
      // Add file parts
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
      
      contentToGenerate = parts;
    } else {
      contentToGenerate = prompt;
    }
    
    // Generate content with 9 second timeout (leaving 1 second buffer)
    const result = await Promise.race([
      geminiModel.generateContent(contentToGenerate),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please try again with shorter input')), 9000)
      )
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('Content generated successfully');

    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        text: text
      }
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Detailed error response
    return res.status(500).json({
      error: 'Failed to generate content',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
