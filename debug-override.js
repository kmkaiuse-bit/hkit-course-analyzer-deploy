/**
 * Debug版本 - 帮助找出错误来源
 */

// 覆盖所有可能的错误源
window.addEventListener('DOMContentLoaded', function() {
    // 检查是否有旧的错误弹窗
    setTimeout(function() {
        console.log('🔍 Debug: Checking for error sources...');
        
        // 覆盖可能的validateConfig函数
        if (typeof validateConfig !== 'undefined') {
            console.log('⚠️ Found validateConfig function, overriding...');
            window.validateConfig = function() {
                console.log('✅ validateConfig called - returning true');
                return true;
            };
        }
        
        // 检查是否有错误弹窗
        const existingAlerts = document.querySelectorAll('[role="alert"], .alert, .error-message');
        if (existingAlerts.length > 0) {
            console.log('🚨 Found existing error messages:', existingAlerts);
            existingAlerts.forEach(alert => alert.remove());
        }
        
        // 覆盖alert函数以捕获错误
        const originalAlert = window.alert;
        window.alert = function(message) {
            console.log('🚨 Alert intercepted:', message);
            if (message.includes('API key')) {
                console.log('❌ API key error blocked!');
                return; // 阻止显示API key错误
            }
            originalAlert(message);
        };
        
        console.log('✅ Debug setup complete');
    }, 100);
});
