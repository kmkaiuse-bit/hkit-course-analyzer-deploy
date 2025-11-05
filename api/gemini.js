// ========== GEMINI SDK (PRODUCTION - ACTIVE) ==========
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
    // ========== GEMINI SDK (PRODUCTION) ==========
    // Check for API key (Gemini)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in environment variables'
      });
    }

    // Parse request body
    const { prompt, model = 'gemini-2.0-flash-exp', temperature = 0.7, maxTokens = 16384, files = [] } = req.body;

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

    console.log('✅ Using Gemini SDK with model:', model);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: model,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
      }
    });

    // Prepare content parts
    const parts = [{ text: prompt }];

    // Add files if present (images for vision)
    if (files && files.length > 0) {
      console.log(`📎 Adding ${files.length} file(s) to request`);
      files.forEach(f => {
        if (f.mimeType && f.data) {
          parts.push({
            inlineData: {
              mimeType: f.mimeType,
              data: f.data
            }
          });
        }
      });
    }

    console.log('🤖 Generating content via Gemini SDK...');

    // Generate content
    const result = await geminiModel.generateContent(parts);
    const response = result.response;
    const text = response.text();

    console.log('✅ Content generated successfully');

    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        text: text
      }
    });
    // ========== END GEMINI SDK ==========

    /* ========== OPENROUTER (DISABLED - TESTING ONLY) ==========
    // This code is kept for reference and can be re-enabled for testing
    // To use OpenRouter:
    // 1. Comment out the Gemini SDK code above
    // 2. Uncomment this OpenRouter section
    // 3. Change process.env.GEMINI_API_KEY to process.env.OPENROUTER_API_KEY

    const messages = [{ role: 'user', content: [{ type: 'text', text: prompt }] }];

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

    const fetchPromise = fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hkit-course-analyzer-deploy.vercel.app',
        'X-Title': 'HKIT Course Analyzer'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages,
        temperature,
        max_tokens: Math.min(maxTokens, 16384),
        top_p: 0.95,
        top_k: 40
      })
    });

    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 55000)
      )
    ]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    ========== END OPENROUTER (DISABLED) ========== */

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
