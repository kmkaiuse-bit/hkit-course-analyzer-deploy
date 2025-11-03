# Supabase 免費自動備份設置指南
## 使用 GitHub Actions 每天自動備份數據庫

**成本**: 完全免費 🎉
**備份頻率**: 每天自動
**保留時間**: 30 天 (GitHub Artifacts) + 7 天 (Git 倉庫)

---

## 📋 備份方案說明

### ✅ 免費方案包含

由於 Supabase **免費計劃不包含自動備份**，我們使用 GitHub Actions 創建免費的自動備份系統：

| 功能 | Supabase 免費 | 我們的方案 |
|------|--------------|-----------|
| 自動備份 | ❌ 無 | ✅ 每天自動 |
| 保留時間 | ❌ 無 | ✅ 30 天 |
| 成本 | 免費 | 免費 |
| 手動觸發 | ✅ 是 | ✅ 是 |

### 🎯 備份內容

- ✅ 所有數據表 (exemption_patterns, decision_history, analysis_results, audit_log)
- ✅ 數據庫結構 (schemas, indexes, constraints)
- ✅ 所有數據記錄
- ✅ 壓縮格式 (節省空間)

### ⏰ 備份時間表

- **自動備份**: 每天香港時間上午 10:00
- **手動備份**: 隨時可在 GitHub 觸發
- **推送備份**: 每次代碼推送時 (可選)

---

## 🚀 快速設置 (5分鐘)

### 步驟 1: 獲取 Supabase 數據庫 URL (2分鐘)

1. 前往 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇你的項目
3. 點擊 **Settings** (⚙️) → **Database**
4. 滾動到 **Connection string** 部分
5. 選擇 **URI** 標籤
6. 複製完整的連接字符串 (類似):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
7. **重要**: 將 `[YOUR-PASSWORD]` 替換為你的實際密碼

### 步驟 2: 獲取 Supabase Access Token (可選) (2分鐘)

1. 在 Supabase Dashboard → **Settings** → **API**
2. 滾動到 **Project API keys**
3. 複製 **service_role** key (保密！)

### 步驟 3: 添加 GitHub Secrets (3分鐘)

1. 前往你的 GitHub 倉庫:
   ```
   https://github.com/kmkaiuse-bit/hkit-course-analyzer-deploy
   ```

2. 點擊 **Settings** (倉庫設置，不是個人設置)

3. 左側菜單點擊 **Secrets and variables** → **Actions**

4. 點擊 **New repository secret**

5. 添加第一個 Secret:
   - Name: `SUPABASE_DB_URL`
   - Value: 粘貼你在步驟 1 複製的完整連接字符串
   - 點擊 **Add secret**

6. 添加第二個 Secret (可選但推薦):
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: 粘貼你在步驟 2 複製的 service_role key
   - 點擊 **Add secret**

### 步驟 4: 啟用 GitHub Actions (1分鐘)

1. 在 GitHub 倉庫點擊 **Actions** 標籤
2. 如果看到提示 "Workflows aren't being run on this repository"
3. 點擊 **I understand my workflows, go ahead and enable them**

### 步驟 5: 推送備份工作流程文件

工作流程文件已創建在: `.github/workflows/supabase-backup.yml`

推送到 GitHub:
```bash
cd hkit-course-analyzer-deploy
git add .github/workflows/supabase-backup.yml
git add docs/deployment/SUPABASE_BACKUP_GUIDE.md
git commit -m "Add automated Supabase backup workflow"
git push
```

---

## ✅ 驗證備份設置

### 立即測試備份

1. 前往 GitHub 倉庫 → **Actions** 標籤
2. 左側點擊 **Supabase Database Backup**
3. 右側點擊 **Run workflow** → **Run workflow** (綠色按鈕)
4. 等待 1-2 分鐘
5. 刷新頁面，應該看到綠色 ✅ (成功) 或紅色 ❌ (失敗)

### 檢查備份文件

**方法 1: GitHub Artifacts (推薦)**
1. Actions → 點擊最新的 workflow run
2. 滾動到底部 **Artifacts** 區域
3. 看到 `supabase-backup-XXX` 文件
4. 點擊下載 (.zip 格式)

**方法 2: Git 倉庫**
1. 倉庫根目錄 → `backups/` 文件夾
2. 看到 `supabase_backup_YYYYMMDD_HHMMSS.sql.gz` 文件

---

## 📥 如何恢復備份

### 恢復到 Supabase

1. **下載備份文件**:
   - GitHub → Actions → Artifacts → 下載
   - 解壓 `.gz` 文件得到 `.sql` 文件

2. **方法 A - 使用 Supabase Dashboard**:
   ```
   Supabase → SQL Editor → New query
   → 粘貼 SQL 內容 → Run
   ```

3. **方法 B - 使用 Supabase CLI** (更快):
   ```bash
   # 解壓備份
   gunzip supabase_backup_20251103_020000.sql.gz

   # 恢復到數據庫
   supabase db push --db-url "your-connection-string" < supabase_backup_20251103_020000.sql
   ```

4. **方法 C - 使用 psql**:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" < backup.sql
   ```

---

## 🎯 備份策略

### 保留規則

| 位置 | 保留時間 | 存儲空間 |
|------|---------|---------|
| GitHub Artifacts | 30 天 | 免費無限制 |
| Git 倉庫 | 7 天 | 計入倉庫大小 |

### 建議

- ✅ 重要變更前手動觸發備份
- ✅ 每月下載一次備份到本地 (長期保存)
- ✅ 定期測試恢復流程 (確保備份可用)

---

## 📊 備份時間表

```
每天香港時間上午 10:00 (UTC 02:00)
    ↓
GitHub Actions 自動運行
    ↓
連接到 Supabase 數據庫
    ↓
導出所有數據和結構
    ↓
壓縮備份文件
    ↓
上傳到 GitHub Artifacts (保留 30 天)
    ↓
提交到 Git 倉庫 (保留 7 天)
    ↓
完成！發送通知
```

---

## 🔧 故障排除

### 問題 1: Backup failed with authentication error

**原因**: SUPABASE_DB_URL 錯誤或密碼不正確

**解決**:
1. 檢查 GitHub Secrets 中的 `SUPABASE_DB_URL`
2. 確保密碼正確 (不是 [YOUR-PASSWORD])
3. 在 Supabase → Settings → Database → Connection string 重新複製

### 問題 2: Workflow not running automatically

**原因**: GitHub Actions 未啟用

**解決**:
1. GitHub → Settings → Actions → General
2. 確保選擇 "Allow all actions and reusable workflows"
3. 保存設置

### 問題 3: Backup file is empty or too small

**原因**: 數據庫連接失敗

**解決**:
1. 檢查 Supabase 項目是否活躍 (未暫停)
2. 檢查連接字符串是否完整
3. 查看 Actions 日誌找到詳細錯誤

### 問題 4: Cannot find backup artifact

**原因**: Workflow 失敗或 artifact 過期

**解決**:
1. 檢查 Actions 標籤查看運行狀態
2. Artifacts 在 30 天後自動刪除
3. 改為從 Git 倉庫的 `backups/` 文件夾獲取

---

## 📱 通知設置 (可選)

### 方法 1: GitHub 郵件通知

1. GitHub → Settings (個人設置) → Notifications
2. 勾選 "Actions" 相關通知
3. 備份失敗時會收到郵件

### 方法 2: Slack/Discord 通知 (進階)

在 workflow 文件添加通知步驟:
```yaml
- name: Send notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 💾 手動備份 (緊急)

如果需要立即備份:

### 方法 1: GitHub Actions (推薦)
1. GitHub → Actions → Supabase Database Backup
2. Run workflow → Run workflow
3. 等待完成 → 下載 Artifact

### 方法 2: Supabase Dashboard
1. Supabase → SQL Editor
2. 運行:
```sql
-- 導出特定表
COPY exemption_patterns TO '/tmp/patterns.csv' CSV HEADER;
COPY analysis_results TO '/tmp/analyses.csv' CSV HEADER;
```

### 方法 3: 使用 Supabase CLI (本地)
```bash
supabase db dump --db-url "your-connection-string" > manual_backup.sql
```

---

## 📈 監控備份狀態

### 檢查最近備份

1. GitHub → Actions
2. 看到綠色 ✅ = 備份成功
3. 看到紅色 ❌ = 備份失敗，需要檢查

### 查看備份大小

```bash
# 在 Actions 日誌中會顯示
Backup created successfully: 245K
```

### 備份歷史

GitHub → Code → `backups/` 文件夾
- 可看到所有 Git 保存的備份 (7 天內)

---

## 🎓 升級選項

如果未來需要更多功能:

### Supabase Pro Plan ($25/月)
- ✅ 自動每日備份 (官方)
- ✅ 7 天恢復點
- ✅ 無需 GitHub Actions

### 第三方備份服務
- SimpleBackups (付費)
- Ottomatik (部分免費)

**建議**: 目前免費方案已足夠！

---

## ✅ 完成檢查清單

設置完成後，確認:

- [ ] GitHub Secrets 已添加 (SUPABASE_DB_URL)
- [ ] Workflow 文件已推送 (.github/workflows/supabase-backup.yml)
- [ ] GitHub Actions 已啟用
- [ ] 手動測試備份成功 (綠色 ✅)
- [ ] 能夠下載備份文件 (Artifacts 或 Git)
- [ ] 了解如何恢復備份

---

## 📞 需要幫助？

**GitHub Actions 文檔**: https://docs.github.com/en/actions
**Supabase CLI 文檔**: https://supabase.com/docs/guides/cli

**檢查備份狀態**:
```
https://github.com/kmkaiuse-bit/hkit-course-analyzer-deploy/actions
```

---

## 🎉 總結

你現在擁有:
- ✅ **自動每日備份** (完全免費)
- ✅ **30 天備份保留** (GitHub Artifacts)
- ✅ **7 天快速訪問** (Git 倉庫)
- ✅ **手動觸發備份** (隨時可用)
- ✅ **壓縮存儲** (節省空間)
- ✅ **簡單恢復** (一鍵下載)

**總成本: HK$0/月** 🎉

你的數據現在是安全的！

---

**文檔版本**: 1.0
**最後更新**: 2025-11-03
**適用項目**: HKIT Course Analyzer
