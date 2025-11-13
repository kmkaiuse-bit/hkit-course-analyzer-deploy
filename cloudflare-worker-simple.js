/**
 * Cloudflare Worker - OpenRouter Proxy for Large Files (Dashboard Compatible)
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://dash.cloudflare.com/
 * 2. Click "Workers & Pages" → "Create Worker"
 * 3. Delete all default code
 * 4. Copy and paste THIS ENTIRE FILE
 * 5. Click "Save and Deploy"
 * 6. Go to Settings → Add Environment Variable:
 *    Name: OPENROUTER_API_KEY
 *    Value: (your OpenRouter API key)
 * 7. Copy your worker URL
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get API key from environment
    const apiKey = OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'API key not configured',
        message: 'Please add OPENROUTER_API_KEY environment variable in Settings'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse incoming request
    const body = await request.json();
    const { prompt, model = 'gemini-2.5-pro', files = [], temperature = 0.7, maxTokens = 16384 } = body;

    // Map model names to OpenRouter format
    const modelMap = {
      'gemini-2.5-pro': 'google/gemini-2.5-pro',
      'gemini-1.5-pro': 'google/gemini-1.5-pro',
      'gemini-2.5-flash': 'google/gemini-2.0-flash-exp:free'
    };
    const openRouterModel = modelMap[model] || 'google/gemini-2.5-pro';

    console.log(`Processing request with ${files.length} files`);

    // Prepare message content
    let messageContent;
    if (files && files.length > 0) {
      messageContent = [{ type: 'text', text: prompt }];

      // Add file parts (PDFs use 'file' type for Gemini native support, images use 'image_url')
      files.forEach(file => {
        if (file.mimeType === 'application/pdf') {
          // OpenRouter PDF format - uses Gemini's native PDF support
          messageContent.push({
            type: 'file',
            file: {
              filename: file.name || 'document.pdf',
              file_data: `data:${file.mimeType};base64,${file.data}`
            }
          });
        } else if (file.mimeType.startsWith('image/')) {
          // Image format
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${file.mimeType};base64,${file.data}`
            }
          });
        }
      });
    } else {
      messageContent = prompt;
    }

    // Call OpenRouter API
    const openRouterRequest = {
      model: openRouterModel,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      temperature: temperature,
      max_tokens: Math.min(maxTokens, 16384),
      top_p: 0.95
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': request.headers.get('Referer') || 'https://hkit-course-analyzer.vercel.app',
        'X-Title': 'HKIT Course Analyzer',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openRouterRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({
        error: `OpenRouter API error: ${response.status}`,
        message: errorData.error?.message || response.statusText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    // Return in same format as Vercel function
    return new Response(JSON.stringify({
      success: true,
      data: {
        text: text
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Worker error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process request',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
