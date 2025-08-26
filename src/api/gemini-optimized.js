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
    const { prompt, model = 'gemini-1.5-flash', temperature = 0.7 } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }

    console.log('Initializing Gemini API with optimized settings...');
    
    // Initialize Gemini with optimized settings for speed
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use flash model with reduced token limit for faster response
    const geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // Always use flash for speed
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 4096, // Reduced for faster response
        topP: 0.95,
        topK: 40,
      },
    });

    console.log('Generating content with timeout protection...');
    
    // Generate content with 9 second timeout (leaving 1 second buffer)
    const result = await Promise.race([
      geminiModel.generateContent(prompt),
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
    
    // Check if it's a timeout error
    if (error.message && error.message.includes('timeout')) {
      return res.status(503).json({
        error: 'Request timeout',
        message: 'The analysis is taking too long. Please try with a smaller file or simpler query.',
        suggestion: 'Try analyzing fewer courses at once'
      });
    }
    
    // Other errors
    return res.status(500).json({
      error: 'Failed to generate content',
      message: error.message || 'Unknown error occurred'
    });
  }
};
