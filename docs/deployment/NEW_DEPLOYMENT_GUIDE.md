# 🎯 新仓库Vercel部署完整指南

## 📋 准备工作清单
- [ ] 代码已推送到 https://github.com/kmkaiuse-bit/advancd-standing-tool
- [ ] 有可用的Gemini API密钥
- [ ] 已登录Vercel账户

## 🚀 步骤1：推送代码到新仓库

在命令行中执行（在 `C:\Users\StevenKok\Desktop\hkit-course-analyzer` 目录）：

```bash
# 添加新仓库为远程源
git remote add new-origin https://github.com/kmkaiuse-bit/advancd-standing-tool.git

# 推送当前分支到新仓库的main分支
git push new-origin hkit-course-analyzer:main --force

# 验证推送成功
echo "Check https://github.com/kmkaiuse-bit/advancd-standing-tool"
```

## 🔧 步骤2：在Vercel中导入新项目

### 2.1 访问Vercel
1. 打开 https://vercel.com/new
2. 点击 "Import Git Repository"

### 2.2 连接GitHub仓库
1. 搜索 "advancd-standing-tool"
2. 点击 "Import"

### 2.3 配置项目（⚠️ 重要）
在配置页面设置以下内容：

#### Project Name
- 输入: `advanced-standing-tool` （或其他你喜欢的名字）

#### Framework Preset
- **必须选择**: `Other`
- **不要选择**: Next.js, React, Vue等任何框架

#### Root Directory
- **留空**（使用默认根目录）

#### Build and Output Settings
- **Build Command**: 留空
- **Output Directory**: 留空  
- **Install Command**: 留空

#### Node.js Version
- 选择: `18.x`

### 2.4 环境变量配置（⚠️ 关键步骤）
点击 "Environment Variables" 展开：

1. 点击 "Add"
2. 添加以下变量：
   ```
   Name: GEMINI_API_KEY
   Value: [你的Gemini API密钥]
   Environment: ✅ Production ✅ Preview ✅ Development
   ```
3. 确保所有三个环境都勾选

### 2.5 部署
1. 点击 "Deploy"
2. 等待部署完成（通常1-2分钟）
3. 记录你的应用URL（类似 `https://advanced-standing-tool.vercel.app`）

## ✅ 步骤3：验证部署

### 3.1 测试API端点
打开浏览器，访问：
1. `https://你的应用.vercel.app/api/test`
   - 应该返回: `{"status":"ok","message":"API is working!"}`

2. `https://你的应用.vercel.app/api/ping`
   - 应该返回: `OK`

### 3.2 测试主应用
1. 访问 `https://你的应用.vercel.app`
2. 页面应该正常加载
3. 打开浏览器开发者工具（F12）
4. 检查Console是否有错误

### 3.3 测试文件上传
1. 选择一个PDF文件
2. 点击分析
3. 检查Network标签
4. 确认 `/api/gemini` 请求返回200状态码

## 🔍 故障排查

### 如果API返回404
1. 在Vercel Dashboard中：
   - 点击你的项目
   - 进入 "Functions" 标签
   - 检查是否显示有函数

2. 如果没有函数显示：
   - 进入 "Settings" → "General"
   - 确认 Framework Preset 是 "Other"
   - 重新部署

### 如果显示API密钥错误
1. 进入 Vercel Dashboard
2. Settings → Environment Variables
3. 确认 `GEMINI_API_KEY` 存在
4. 重新部署（Deployments → 三个点 → Redeploy）

### 如果还是不工作
1. 检查部署日志：
   - Deployments → 点击最新部署
   - 查看 "Function Logs"

2. 创建issue并提供：
   - 部署URL
   - 错误截图
   - Network标签截图

## 📝 后续维护

### 更新代码
```bash
git add .
git commit -m "你的更新说明"
git push new-origin main
```
Vercel会自动重新部署

### 查看日志
1. Vercel Dashboard → Functions
2. 点击函数名称
3. View Logs

## ✨ 成功标志
- [ ] 主页正常加载
- [ ] `/api/test` 返回成功响应
- [ ] 可以上传PDF文件
- [ ] 分析功能正常工作
- [ ] 可以导出CSV结果

---

## 🆘 需要帮助？
如果遇到问题，请提供：
1. 你的Vercel应用URL
2. 错误信息截图
3. Vercel Functions页面截图
4. 浏览器Console错误信息
