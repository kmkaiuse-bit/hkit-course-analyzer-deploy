# 🖥️ 本地运行指南

## 快速开始（3步）

### 1️⃣ 配置 API 密钥
编辑 `config/api-config-local.js` 文件：
```javascript
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE'; // 替换为你的实际密钥
```

获取免费 API 密钥：https://makersuite.google.com/app/apikey

### 2️⃣ 启动本地服务器

选择以下任一方法：

#### 方法 A：Python（推荐）
```bash
# Python 3
python -m http.server 8080

# 或 Python 2
python -m SimpleHTTPServer 8080
```

#### 方法 B：Node.js
```bash
# 安装 http-server（只需一次）
npm install -g http-server

# 运行服务器
http-server -p 8080
```

#### 方法 C：VS Code Live Server
1. 安装 "Live Server" 扩展
2. 右键点击 `index-local.html`
3. 选择 "Open with Live Server"

### 3️⃣ 打开应用
浏览器访问：http://localhost:8080/index-local.html

## ✅ 功能验证

1. 页面右上角显示 "🖥️ LOCAL MODE" 标志
2. 如果未配置 API 密钥，会显示黄色提示框
3. 配置密钥后，提示框消失，可以正常使用

## 📋 使用流程

1. **上传文件** - 拖放或点击上传 CSV/Excel/PDF 成绩单
2. **选择课程** - 从下拉菜单选择目标课程
3. **分析** - 点击 "Analyze Files" 按钮
4. **查看结果** - 支持表格和 JSON 视图
5. **导出** - 多种格式导出（CSV、Excel、PDF、JSON）

## ⚠️ 注意事项

- **API 密钥安全**：密钥只保存在你的代码中，不会上传
- **API 限制**：免费层每分钟 60 次请求
- **超时**：本地模式无 10 秒限制，可处理大文件

## 🔧 故障排除

### 问题：API 密钥错误
- 确认密钥格式正确（以 AIza 开头）
- 检查是否已启用 Gemini API

### 问题：CORS 错误
- 必须使用本地服务器，不能直接双击打开 HTML
- 确保使用 http://localhost 而非 file://

### 问题：文件无法解析
- 确保 PDF 不是扫描版
- Excel/CSV 文件编码应为 UTF-8

## 📊 API 使用监控

查看使用量：
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 选择项目 → APIs & Services → Credentials
3. 查看 API 使用统计

## 🎯 本地版本优势

✅ **无部署需求** - 直接在本地运行
✅ **无超时限制** - 可处理大型分析任务
✅ **完全控制** - API 密钥在你手中
✅ **即时修改** - 改代码立即生效

---

**享受本地版 HKIT Course Analyzer！** 🎉
