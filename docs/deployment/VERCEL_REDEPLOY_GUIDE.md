# 🚀 Vercel重新部署完整指南

## 📝 前置准备
确保你的GitHub仓库 `hkit-course-analyzer` 分支已经包含最新代码。

## 步骤1：删除当前Vercel项目
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的 `hkit-course-analyzer` 项目
3. 点击项目进入设置
4. 滚动到底部，找到 "Delete Project"
5. 确认删除

## 步骤2：重新导入项目
1. 回到 Vercel Dashboard
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 找到你的 `hkit-course-analyzer` 仓库
5. **重要配置**：
   - **Framework Preset**: 选择 `Other`（不要选择任何框架）
   - **Root Directory**: 留空（默认使用根目录）
   - **Build & Output Settings**:
     - Build Command: 留空
     - Output Directory: 留空
     - Install Command: 留空
   - **Node.js Version**: 18.x

## 步骤3：配置环境变量
在导入页面的 "Environment Variables" 部分：
1. 点击 "Add"
2. 添加以下变量：
   - Name: `GEMINI_API_KEY`
   - Value: 你的Gemini API密钥
   - Environment: 勾选所有（Production, Preview, Development）

## 步骤4：选择正确的分支
1. 在 "Git Branch" 部分
2. 选择 `hkit-course-analyzer` 分支（不是main）

## 步骤5：部署
1. 点击 "Deploy"
2. 等待部署完成（通常1-2分钟）

## 步骤6：验证部署
部署完成后：
1. 访问你的应用URL
2. 打开浏览器开发者工具（F12）
3. 进入Network标签
4. 刷新页面并尝试上传文件
5. 检查 `/api/test` 请求是否返回200

## 🔍 验证清单
- [ ] `/api/test` 返回 "API is working!"
- [ ] `/api/gemini` 可以正常调用
- [ ] 上传文件后能看到分析结果
- [ ] 没有API密钥错误提示

## ⚠️ 如果还是不工作
如果重新部署后还是404，尝试以下方法：

### 方法1：检查部署日志
1. 在Vercel Dashboard中点击你的项目
2. 点击 "Functions" 标签
3. 查看是否有函数被检测到
4. 点击 "View Function Logs" 查看错误

### 方法2：使用vercel.json强制配置
确保 `vercel.json` 内容如下：
```json
{
  "functions": {
    "api/*.js": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 方法3：创建最小测试
创建一个新文件 `api/hello.js`：
```javascript
module.exports = (req, res) => {
  res.status(200).json({ message: 'Hello World' });
};
```

然后提交并推送，看是否能访问 `/api/hello`。

## 📞 需要更多帮助？
如果按照以上步骤还是无法解决，请提供：
1. Vercel部署日志的截图
2. Functions标签页的截图
3. 浏览器Network标签的截图
