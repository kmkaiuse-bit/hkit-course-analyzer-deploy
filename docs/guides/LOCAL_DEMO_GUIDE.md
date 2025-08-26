# 🖥️ 本地演示版本使用指南

## 快速开始

### 方法1：直接打开（最简单）
1. 在文件管理器中找到 `local-demo.html`
2. 双击打开（会在默认浏览器中打开）
3. 输入你的 Gemini API 密钥
4. 开始使用！

### 方法2：使用 Python 本地服务器（推荐）
```bash
# 在项目目录中运行
cd C:\Users\StevenKok\Desktop\hkit-course-analyzer

# Python 3
python -m http.server 8000

# 或 Python 2
python -m SimpleHTTPServer 8000
```
然后访问: http://localhost:8000/local-demo.html

### 方法3：使用 Node.js 本地服务器
```bash
# 安装 http-server (只需安装一次)
npm install -g http-server

# 在项目目录运行
cd C:\Users\StevenKok\Desktop\hkit-course-analyzer
http-server -p 8000
```
然后访问: http://localhost:8000/local-demo.html

### 方法4：使用 VS Code Live Server
1. 在 VS Code 中打开项目文件夹
2. 安装 "Live Server" 扩展
3. 右键点击 `local-demo.html`
4. 选择 "Open with Live Server"

## 🔑 获取 Gemini API 密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 点击 "Create API Key"
3. 选择或创建一个项目
4. 复制生成的密钥（格式: AIzaSy...）

## 📋 使用步骤

### 1. 配置 API 密钥
- 在页面顶部输入你的 Gemini API 密钥
- 点击 "Save API Key"
- 等待验证成功提示

### 2. 上传成绩单
- 点击上传区域
- 选择 HKIT 成绩单 PDF 文件
- 等待文件解析完成

### 3. 选择目标大学
- 点击想要申请的大学按钮
- 支持 PolyU, CityU, HKU 等

### 4. 开始分析
- 点击 "Analyze Transcript"
- 等待 AI 分析完成（约 30-60 秒）
- 查看分析结果

### 5. 导出结果
- 点击 "Export to CSV" 保存结果
- 或点击 "Print Report" 打印报告

## 🎯 本地版本优势

✅ **完全本地运行**
- 无需服务器
- 无需 Vercel 部署
- 无超时限制

✅ **数据安全**
- API 密钥保存在浏览器本地
- 数据不经过任何服务器
- 完全的隐私保护

✅ **直接调用 Gemini API**
- 没有中间层
- 最快的响应速度
- 完整的 API 功能

## ⚠️ 注意事项

1. **API 密钥安全**
   - 密钥保存在浏览器的 localStorage 中
   - 不要在公共电脑上使用
   - 定期更换 API 密钥

2. **浏览器要求**
   - 推荐使用 Chrome、Edge 或 Firefox
   - 需要启用 JavaScript
   - 需要允许跨域请求（CORS）

3. **API 使用限制**
   - 免费层每分钟 60 次请求
   - 每天 1500 次请求
   - 适合个人使用

## 🐛 故障排除

### 问题：API 密钥验证失败
- 检查密钥是否正确（应以 AIza 开头）
- 确保 API 已在 Google Cloud 中启用
- 检查网络连接

### 问题：PDF 无法解析
- 确保 PDF 不是扫描版
- 尝试重新下载 PDF
- 检查浏览器控制台错误

### 问题：分析超时
- 减少一次分析的课程数量
- 检查网络连接
- 尝试使用更简单的查询

## 📊 API 使用量监控

查看你的 API 使用情况：
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 选择你的项目
3. 进入 "APIs & Services" → "Credentials"
4. 查看 API 使用统计

## 🔄 更新和维护

本地版本无需部署，更新只需：
1. 从 GitHub 拉取最新代码
2. 刷新浏览器页面

## 💡 提示

- 第一次使用时验证 API 密钥可能需要几秒钟
- API 密钥会自动保存，下次打开无需重新输入
- 如果遇到 CORS 错误，使用本地服务器运行
- 分析大文件时请耐心等待

---

**享用你的本地 HKIT Course Analyzer！** 🎉
