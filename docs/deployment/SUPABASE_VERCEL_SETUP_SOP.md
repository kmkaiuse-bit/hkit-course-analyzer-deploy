# Supabase + Vercel 部署指南 (1分鐘快速設定)
## HKIT Course Analyzer 雲端數據庫設置 SOP

**閱讀時間**: 1 分鐘 | **設置時間**: 15 分鐘

---

## 📋 前置準備

✅ 已有 Vercel 帳號 (已部署應用)
✅ 準備好創建 Supabase 帳號 (免費)
✅ Google Gemini API 密鑰已配置在系統中

---

## 🚀 5步驟完整設置

### 步驟 1️⃣: 創建 Supabase 數據庫 (3分鐘)

1. 前往 https://supabase.com → 點擊 **Start your project**
2. 註冊/登入 (免費，無需信用卡)
3. 點擊 **New Project**:
   - Project Name: `hkit-learning-db`
   - Database Password: 設置強密碼 (記住它！)
   - Region: 選擇 **Singapore** 或 **Tokyo** (最接近香港)
4. 點擊 **Create Project** → 等待 2-3 分鐘初始化

---

### 步驟 2️⃣: 創建數據表 (5分鐘)

1. 在 Supabase 左側菜單點擊 **SQL Editor**
2. 點擊 **New query** 按鈕
3. 在電腦打開文件: `db/migrations/002_supabase_schema.sql`
4. 複製全部內容 (Ctrl+A → Ctrl+C)
5. 貼到 Supabase SQL Editor (Ctrl+V)
6. 點擊右下角 **Run** 按鈕

**✅ 成功提示**: `Success. No rows returned`

**驗證**: 點擊左側 **Table Editor** → 應看到 4 個表:
- `exemption_patterns` (5 行樣本數據)
- `decision_history`
- `analysis_results`
- `audit_log`

---

### 步驟 3️⃣: 連接 Vercel 整合 (3分鐘)

**方法 A - 從 Vercel (推薦)**:
1. 前往 https://vercel.com/dashboard
2. 點擊 **Integrations** 標籤頁
3. 搜索 "Supabase" → 點擊 **Supabase** 卡片
4. 點擊 **Add Integration**
5. 選擇 **Specific Projects** → 選擇你的項目
6. 選擇你剛創建的 Supabase 項目
7. 點擊 **Connect**

**方法 B - 從 Supabase**:
1. Supabase Dashboard → **Settings** (⚙️)
2. 點擊 **Integrations**
3. 找到 **Vercel** → 點擊 **Connect**
4. 選擇你的 Vercel 項目 → 點擊 **Save**

**✅ 完成**: 環境變數自動同步到 Vercel！

---

### 步驟 4️⃣: 驗證環境變數 (1分鐘)

1. Vercel Dashboard → 你的項目 → **Settings** → **Environment Variables**
2. 確認看到這些變數:
   - `SUPABASE_URL` 或 `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_ANON_KEY` 或 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 其他 Supabase 相關變數

**如果沒有**: 手動添加以下變數:

```
DB_HOST=db.[你的項目ID].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[你的數據庫密碼]
```

---

### 步驟 5️⃣: 部署並測試 (3分鐘)

**部署**:
```bash
git add .
git commit -m "Add Supabase integration"
git push
```

**測試** (部署完成後 2-3 分鐘):
1. 前往: `https://你的應用.vercel.app/`
2. 填寫學生信息
3. 上傳測試成績單
4. 選擇課程 → 點擊 **Analyze Files**
5. 等待分析完成
6. 點擊 **💾 Save to Database**
7. 返回 Supabase → **Table Editor** → 檢查新數據！

---

## ✅ 成功檢查清單

- [ ] Supabase 項目已創建
- [ ] 4 個數據表已創建 (可在 Table Editor 看到)
- [ ] Vercel 整合已連接
- [ ] 環境變數已自動同步
- [ ] 代碼已推送到 GitHub
- [ ] Vercel 部署成功
- [ ] 測試上傳成績單 → 分析 → 保存
- [ ] Supabase 中可看到新數據

---

## 🎯 你的雲端架構

```
學校用戶
   ↓
Vercel (免費網站托管)
   ↓
Supabase (免費 PostgreSQL 數據庫)
   - 500MB 存儲空間
   - 自動備份
   - 可存儲 50,000+ 學習模式
```

**總成本: HK$0/月** 🎉

---

## 📊 查看數據

### 方法 1: Supabase Dashboard
1. https://supabase.com/dashboard
2. 選擇項目 → **Table Editor**
3. 點擊表格查看/編輯數據

### 方法 2: SQL 查詢
1. 點擊 **SQL Editor**
2. 運行查詢:

```sql
-- 查看所有學習模式
SELECT * FROM pattern_analysis ORDER BY confidence DESC LIMIT 10;

-- 查看最近分析
SELECT * FROM recent_analyses LIMIT 10;

-- 查看統計數據
SELECT * FROM learning_stats;
```

---

## 🔧 常見問題

### Q1: 找不到 002_supabase_schema.sql 文件？
**A**: 文件位置: `項目根目錄/db/migrations/002_supabase_schema.sql`

### Q2: SQL 運行後出現錯誤？
**A**: 確保:
- 複製了完整的 SQL 內容 (所有 266 行)
- 沒有在開頭添加任何文字
- 點擊了 **Run** 按鈕而非其他按鈕

### Q3: Vercel 沒有自動部署？
**A**:
```bash
# 手動觸發部署
vercel --prod
```

### Q4: 保存數據時出錯？
**A**: 檢查:
1. Vercel 環境變數是否正確
2. Supabase 項目是否活躍 (未暫停)
3. 查看 Vercel 部署日誌查找錯誤

### Q5: 如何重置數據庫？
**A**: 在 Supabase SQL Editor 重新運行步驟 2 的 SQL

---

## 📱 分享給同事

將此網址分享給學校同事:
```
https://hkit-course-analyzer-deploy.vercel.app/
```

他們可以:
- 無需安裝任何軟件
- 無需提供 API 密鑰 (系統已配置)
- 在任何設備上使用
- 數據手動保存到雲端 (點擊 "Save to Database" 確認後)
- 系統自動學習並改進

---

## 🔄 日後更新代碼

```bash
# 1. 修改代碼
# 2. 提交並推送
git add .
git commit -m "描述你的更改"
git push

# 3. Vercel 自動部署！
```

---

## 📞 需要幫助？

**Supabase 文檔**: https://supabase.com/docs
**Vercel 文檔**: https://vercel.com/docs

**數據庫密碼找回**:
Supabase → Settings → Database → Reset Password

**環境變數位置**:
Supabase → Settings → Database → Connection string

---

## 💾 備份建議

Supabase 自動每日備份，但建議:

**每月手動備份**:
1. Supabase → Settings → Database
2. 往下滾動到 **Database backups**
3. 點擊 **Create backup**

或使用 SQL 導出:
```sql
-- 在 SQL Editor 運行
COPY exemption_patterns TO '/tmp/backup.csv' CSV HEADER;
```

---

## 🎓 完成設置後

你現在擁有:
- ✅ 雲端數據庫 (Supabase PostgreSQL)
- ✅ 雲端網站 (Vercel 托管)
- ✅ 自動部署 (推送代碼即部署)
- ✅ 自動備份 (Supabase 處理)
- ✅ 全球訪問 (任何地方任何時間)
- ✅ 學習系統 (AI 自動改進)

**總成本: HK$0/月** 🎉

開始分析成績單，系統會自動學習並越來越準確！

---

**文檔版本**: 1.0
**最後更新**: 2025-11-03
**適用項目**: HKIT Course Analyzer
