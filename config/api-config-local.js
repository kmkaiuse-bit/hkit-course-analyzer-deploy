/**
 * Local API Configuration
 * 本地开发配置 - 直接调用 Gemini API
 * 
 * 使用方法：
 * 1. 获取 Gemini API 密钥：https://makersuite.google.com/app/apikey
 * 2. 在下面填入你的 API 密钥
 * 3. 使用本地服务器运行（见 LOCAL_SETUP.md）
 */

//⚠️ 重要：此密钥应通过环境变量加载，而不是硬编码
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_FALLBACK_API_KEY_FOR_LOCAL_DEV'; // 本地开发时可使用备用值

const API_CONFIG = {
    gemini: {
        apiKey: GEMINI_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-1.5-pro-latest',
    },
    
    // 请求设置
    request: {
        timeout: 60000, // 60秒
        retries: 2,     // 重试次数
    },

    /**
     * 验证关键配置是否存在
     */
    validate: function() {
        if (!this.gemini.apiKey || this.gemini.apiKey.startsWith('YOUR_')) {
            throw new Error('Gemini API key is not properly configured. Please check your environment variables.');
        }
    },

    /**
     * 获取完整的API端点URL
     * @returns {string}
     */
    getEndpoint: function() {
        return `${this.gemini.baseUrl}/models/${this.gemini.model}:generateContent`;
    }
};

/**
 * 本地模式：直接调用 Gemini API
 */
async function callGeminiAPI(prompt) {
    // 检查 API 密钥
    if (!API_CONFIG.apiKey || API_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
        alert('请先配置 Gemini API 密钥！\n\n1. 编辑 config/api-config-local.js\n2. 填入你的 API 密钥\n3. 刷新页面');
        throw new Error('API key not configured');
    }
    
    try {
        const response = await fetch(`${API_CONFIG.geminiEndpoint}?key=${API_CONFIG.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return {
            success: true,
            data: {
                text: data.candidates[0].content.parts[0].text
            }
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}

// 导出配置
window.API_CONFIG = API_CONFIG;
window.callGeminiAPI = callGeminiAPI;

// 启动时显示配置状态
window.addEventListener('DOMContentLoaded', () => {
    if (API_CONFIG.apiKey && API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
        console.log('✅ Local API mode enabled with configured key');
    } else {
        console.warn('⚠️ Please configure your Gemini API key in config/api-config-local.js');
        
        // 显示配置提示
        const configAlert = document.createElement('div');
        configAlert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        configAlert.innerHTML = `
            <strong>⚠️ 本地模式 - 需要配置</strong><br>
            <ol style="margin: 10px 0 0 20px; font-size: 14px;">
                <li>编辑 <code>config/api-config-local.js</code></li>
                <li>填入你的 Gemini API 密钥</li>
                <li>刷新页面</li>
            </ol>
            <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: #0066cc;">
                获取免费 API 密钥 →
            </a>
        `;
        document.body.appendChild(configAlert);
    }
});
