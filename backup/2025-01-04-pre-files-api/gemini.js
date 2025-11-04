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

    // Parse request body - use 2.5 pro for complex multi-course analysis with large output
    const { prompt, model = 'gemini-2.5-pro', temperature = 0.7, maxTokens = 16384, files = [] } = req.body;

    // Debug logging
    console.log('📍 Request received:', {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      model: model,
      filesCount: files?.length || 0,
      bodyKeys: Object.keys(req.body || {})
    });

    if (!prompt) {
      console.error('❌ Missing prompt in request body');
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }

    console.log('✅ Initializing Gemini API with model:', model);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use a faster model for better performance
    const geminiModel = genAI.getGenerativeModel({
      model: model,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: Math.min(maxTokens, 16384), // Increased for multi-course analysis
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
    
    // Generate content with 55 second timeout (leaving 5 second buffer for 60s Vercel limit)
    const result = await Promise.race([
      geminiModel.generateContent(contentToGenerate),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again with shorter input')), 55000)
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
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // More detailed error response for debugging
    return res.status(500).json({
      error: 'Failed to generate content',
      message: error.message || 'Unknown error occurred',
      errorType: error.name || 'Unknown',
      details: error.stack ? error.stack.substring(0, 500) : undefined,
      timestamp: new Date().toISOString()
    });
  }
};
