// File analysis endpoint - OpenRouter compatible (uses base64 inline data)
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return res.status(500).json({
        error: 'OpenRouter API key not configured',
        details: 'Please set OPENROUTER_API_KEY in environment variables'
      });
    }

    // Parse request body - now accepts fileData (base64) instead of fileUri
    const { prompt, fileData, fileUri, fileName, mimeType = 'application/pdf', model = 'gemini-2.5-pro', temperature = 0.3, maxTokens = 16384 } = req.body;

    // Use fileData (from new upload endpoint) or fileUri (legacy compatibility)
    const base64Data = fileData || fileUri;

    // Map model names to OpenRouter format
    const modelMap = {
      'gemini-2.5-pro': 'google/gemini-2.5-pro',
      'gemini-1.5-pro': 'google/gemini-1.5-pro',
      'gemini-2.5-flash': 'google/gemini-2.0-flash-exp:free'
    };
    const openRouterModel = modelMap[model] || 'google/gemini-2.5-pro';

    // Debug logging
    console.log('📍 Analyze file request received:', {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      hasFileData: !!base64Data,
      fileName: fileName,
      model: openRouterModel
    });

    if (!prompt) {
      console.error('❌ Missing prompt in request body');
      return res.status(400).json({
        error: 'Missing required field: prompt'
      });
    }

    if (!base64Data) {
      console.error('❌ Missing fileData or fileUri in request body');
      return res.status(400).json({
        error: 'Missing required field: fileData or fileUri (base64 encoded file data)'
      });
    }

    console.log(`🔍 Analyzing file: ${fileName} via OpenRouter...`);

    // Prepare message content with file (OpenAI-compatible format)
    const messageContent = [
      { type: 'text', text: prompt },
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`
        }
      }
    ];

    // Call OpenRouter API with 55 second timeout
    const fetchPromise = fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://hkit-course-analyzer.vercel.app',
        'X-Title': 'HKIT Course Analyzer',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [{ role: 'user', content: messageContent }],
        temperature: temperature,
        max_tokens: Math.min(maxTokens, 16384),
        top_p: 0.95
      })
    });

    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again with shorter input')), 55000)
      )
    ]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    console.log('✅ Content generated successfully via OpenRouter');
    console.log(`📊 Response length: ${text.length} characters`);

    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        text: text
      }
    });

  } catch (error) {
    console.error('OpenRouter API Error:', error);
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
