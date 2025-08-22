/**
 * Vercel Function: Gemini API Proxy
 * 安全地代理对Gemini API的调用，支持PDF文件处理
 */

module.exports = async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 从环境变量获取API密钥（安全）
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // 从请求体获取数据
        const { prompt, model = 'gemini-1.5-pro', files = [] } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`🚀 Processing request with model: ${model}`);
        console.log(`📄 Files to process: ${files.length}`);

        // 构建Gemini API请求
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
            }
        };

        // 添加PDF文件到请求中
        if (files && files.length > 0) {
            for (const file of files) {
                if (file.mimeType === 'application/pdf' && file.data) {
                    console.log(`📎 Adding PDF file: ${file.name}`);
                    requestBody.contents[0].parts.push({
                        inline_data: {
                            mime_type: file.mimeType,
                            data: file.data
                        }
                    });
                }
            }
        }

        console.log('📡 Calling Gemini API...');

        // 调用Gemini API
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Successfully received response from Gemini API');

        // 返回结果给前端
        res.status(200).json(data);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
