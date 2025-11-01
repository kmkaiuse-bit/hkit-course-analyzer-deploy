/**
 * API Configuration - 安全版本
 * 通过Vercel Functions调用API，不暴露密钥
 */

const API_CONFIG = {
    // Vercel Function 端点
    functions: {
        gemini: '/api/gemini', // 我们的安全代理端点
    },

    // Request Settings
    timeout: 30000,
    retries: 2
};

/**
 * 调用Gemini API（通过Vercel Function）
 * @param {string} prompt - 分析提示
 * @returns {Promise} API响应
 */
async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(API_CONFIG.functions.gemini, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'gemini-2.5-flash'
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

/**
 * 验证API配置（现在总是返回true，因为无需前端密钥）
 * @returns {boolean} True if configuration is valid
 */
function validateConfig() {
    return true; // Vercel Functions处理验证
}

// 向后兼容的函数
function getGeminiEndpoint() {
    return API_CONFIG.functions.gemini;
}
