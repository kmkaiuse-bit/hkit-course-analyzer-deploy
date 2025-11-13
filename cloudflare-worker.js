/**
 * Cloudflare Worker - OpenRouter Proxy for Large Files
 * Last updated: 2025-01-13
 *
 * Deployment:
 * 1. Go to https://workers.cloudflare.com/
 * 2. Create a new worker
 * 3. Paste this code
 * 4. Add environment variable: OPENROUTER_API_KEY
 * 5. Deploy
 *
 * Benefits:
 * - 10MB body size limit (vs Vercel's 4.5MB)
 * - Free tier: 100,000 requests/day
 * - Global edge network
 * - Perfect for large scanned PDF transcripts
 */

export default {
  async fetch(request, env) {
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

    // Handle GET for health check
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'HKIT Course Analyzer - OpenRouter Proxy',
        version: '1.0.0',
        message: 'Worker is running! Use POST requests to analyze PDFs.',
        endpoints: {
          analyze: 'POST / with JSON body containing prompt and files'
        },
        limits: {
          maxFileSize: '7.5MB',
          requestBodySize: '10MB'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only allow POST for actual processing
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST for PDF analysis or GET for health check.' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Get API key from environment
      const apiKey = env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({
          error: 'API key not configured'
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
};
