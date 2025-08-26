# 📦 代码迁移到新仓库指南

## 步骤1：添加新的远程仓库
在你的项目目录（`C:\Users\StevenKok\Desktop\hkit-course-analyzer`）中执行：

```bash
# 1. 查看当前远程仓库
git remote -v

# 2. 添加新的远程仓库
git remote add new-origin https://github.com/kmkaiuse-bit/advancd-standing-tool.git

# 3. 推送到新仓库的main分支
git push new-origin hkit-course-analyzer:main

# 4. 如果上面的命令失败（因为新仓库不是空的），使用强制推送
git push new-origin hkit-course-analyzer:main --force
```

## 步骤2：切换默认远程仓库（可选）
如果你想让这个项目以后默认推送到新仓库：

```bash
# 1. 删除旧的origin
git remote remove origin

# 2. 重命名new-origin为origin
git remote rename new-origin origin

# 3. 设置上游分支
git branch --set-upstream-to=origin/main
```

## 步骤3：验证推送成功
访问 https://github.com/kmkaiuse-bit/advancd-standing-tool 
确认所有文件都已经推送成功。

## ⚠️ 注意事项
- 确保 `.gitignore` 文件存在，避免推送敏感信息
- API密钥应该只在Vercel环境变量中配置，不要提交到代码中
