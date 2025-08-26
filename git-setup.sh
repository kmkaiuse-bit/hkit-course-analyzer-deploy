#!/bin/bash

echo "���️ 移除敏感檔案..."

# 移除敏感檔案
git reset HEAD local/config/api-config-local.js
git reset HEAD src/config/api-config-local.js
git reset HEAD .claude/settings.local.json
git reset HEAD "Provide your school.docx"
git reset HEAD "~$ovide your school.docx"
git reset HEAD local/assets/images/hkit_analysis_business_2025-08-21T03-06-04.csv
git reset HEAD src/assets/images/hkit_analysis_business_2025-08-21T03-06-04.csv

# 將這些檔案加入 .gitignore
echo "
# Additional sensitive files
.claude/
*.docx
~$*.docx
**/*api-config-local.js
**/*.csv" >> .gitignore

echo "✅ 敏感檔案已移除，更新 .gitignore"

# 重新添加安全的檔案
git add .

echo "��� 清理後的檔案狀態："
git status --short

echo "⚠️ 請檢查上述清單，確認無敏感檔案後按 Enter 繼續..."
read -r

# 提交
git commit -m "Initial commit: HKIT Course Analyzer with Gemini AI integration

✅ Features:
- Course exemption analysis with Gemini 1.5 Pro
- PDF transcript viewing with PDF.js
- Academic year level selection
- 3-button export system (CSV, Excel, PDF)
- Enhanced UI with English translations
- Student information management
- Study plan generation

��� Technical:
- Vanilla JavaScript with modular architecture
- Local and production versions
- Responsive design with modern styling
- Error handling and validation

��� Ready for deployment and further development"

# 推送到 GitHub
git remote add origin https://github.com/kmkaiuse-bit/HKIT-Advance-stadning-clean.git
git push -u origin main

echo "✅ 安全推送完成！"
echo "��� 查看倉庫：https://github.com/kmkaiuse-bit/HKIT-Advance-stadning-clean"
