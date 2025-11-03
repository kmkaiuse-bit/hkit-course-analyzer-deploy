# Vercel + Supabase Setup Guide
## Complete Cloud Deployment (FREE)

Your Vercel app: https://hkit-course-analyzer-deploy.vercel.app
Your Supabase: https://hainmitjatzhapayubtg.supabase.co

---

## ✅ Step-by-Step Setup (30 minutes)

### Step 1: Get Database Connection Details (5 mins)

1. Go to: https://supabase.com/dashboard
2. Click your project: `hainmitjatzhapayubtg`
3. Click **Settings** (⚙️ icon, bottom left)
4. Click **Database**
5. Scroll to **Connection info** section

**Screenshot location:**
```
Settings → Database → Connection info
```

**Copy these values:**
```
Host: db.hainmitjatzhapayubtg.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Click "👁️ Reveal" to see it]
```

**Alternative (Connection Pooling - Recommended for Vercel):**
```
Host: aws-0-ap-southeast-1.pooler.supabase.com
Port: 6543
User: postgres.hainmitjatzhapayubtg
Password: [Same password]
```

---

### Step 2: Create Database Tables (10 mins)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query** button
3. Open this file on your computer: `db/migrations/002_supabase_schema.sql`
4. Copy ALL the SQL content
5. Paste into Supabase SQL Editor
6. Click **Run** button (bottom right)

**Expected result:**
```
✅ Success. No rows returned
```

**This creates:**
- ✅ 4 tables: exemption_patterns, decision_history, analysis_results, audit_log
- ✅ All indexes for performance
- ✅ 5 sample patterns for testing
- ✅ 3 views for easy querying

**Verify it worked:**
1. Click **Table Editor** (left sidebar)
2. You should see these tables:
   - exemption_patterns
   - decision_history
   - analysis_results
   - audit_log
3. Click **exemption_patterns** → should show 5 sample rows

---

### Step 3: Add Secrets to Vercel (5 mins)

1. Go to: https://vercel.com/dashboard
2. Click your project: `hkit-course-analyzer-deploy`
3. Click **Settings** tab (top)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New** button

**Add these 5 variables ONE BY ONE:**

| Key | Value | Notes |
|-----|-------|-------|
| `DB_HOST` | `db.hainmitjatzhapayubtg.supabase.co` | Or pooler host if using pooling |
| `DB_PORT` | `5432` | Or `6543` for pooling |
| `DB_NAME` | `postgres` | Always postgres for Supabase |
| `DB_USER` | `postgres` | Or `postgres.hainmitjatzhapayubtg` for pooling |
| `DB_PASSWORD` | `[your-supabase-password]` | Click 👁️ in Supabase to reveal |

**For each variable:**
1. Enter the **Key** name (exactly as shown, case-sensitive)
2. Enter the **Value**
3. Select **All Environments** (Production, Preview, Development)
4. Click **Save**

**Screenshot location:**
```
Settings → Environment Variables → Add New
```

---

### Step 4: Update Your Code (Local) (5 mins)

On your laptop, make sure your code uses PostgreSQL connection (not SQLite):

1. Open: `server/learning-server.js`
2. Check line 16:

**Should be:**
```javascript
const dbConnection = require('../local/assets/js/db/connection');
```

**NOT this:**
```javascript
const dbConnection = require('../local/assets/js/db/connection-sqlite');  // ❌ Wrong!
```

3. If you need to change it, save the file

---

### Step 5: Deploy to Vercel (5 mins)

#### Option A: Push to GitHub (Auto-deploy)

```bash
git add .
git commit -m "Add Supabase database connection"
git push
```

Vercel will automatically detect the push and deploy!

#### Option B: Manual Deploy

```bash
# In your project directory
vercel --prod
```

**Wait 2-3 minutes** for deployment to complete.

---

### Step 6: Test Your Deployed App (5 mins)

1. Go to: https://hkit-course-analyzer-deploy.vercel.app/local/enhanced.html

2. **Test the learning system:**
   - Upload a sample transcript PDF
   - Select a programme
   - Click **Analyze**
   - Review results
   - Click **💾 Save to Database**

3. **Verify data was saved:**
   - Go to Supabase dashboard
   - Click **Table Editor**
   - Click **exemption_patterns** table
   - You should see NEW rows added! 🎉

4. **Check analysis results:**
   - In Table Editor, click **analysis_results**
   - You should see your analysis saved!

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Supabase tables created (4 tables visible in Table Editor)
- [ ] Sample data exists (5 rows in exemption_patterns)
- [ ] Vercel environment variables added (5 variables)
- [ ] Code uses correct connection (PostgreSQL, not SQLite)
- [ ] App deployed and accessible at Vercel URL
- [ ] Can upload transcript and analyze
- [ ] Data saves to Supabase (check Table Editor)
- [ ] No console errors when using the app

---

## 🎯 Your Final Setup

```
┌─────────────────────────────────────────┐
│  Users (School Staff)                   │
│  Access from anywhere, any device       │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│  Vercel (Web Hosting) - FREE            │
│  https://hkit-course-analyzer-          │
│         deploy.vercel.app                │
│  • Serves HTML/JS/CSS                   │
│  • Serverless functions                 │
│  • Auto HTTPS                           │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│  Supabase (Database) - FREE             │
│  https://hainmitjatzhapayubtg           │
│         .supabase.co                     │
│  • PostgreSQL database                  │
│  • Automatic backups                    │
│  • 500MB storage (50,000+ patterns!)    │
└─────────────────────────────────────────┘
```

**Cost: $0/month** 🎉

---

## 📊 View Your Data

### Option 1: Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor**
4. Browse/edit tables directly

### Option 2: SQL Queries
1. Click **SQL Editor**
2. Try these queries:

```sql
-- View all patterns
SELECT * FROM pattern_analysis ORDER BY confidence DESC LIMIT 10;

-- View recent analyses
SELECT * FROM recent_analyses LIMIT 10;

-- View statistics
SELECT * FROM learning_stats;

-- Count total records
SELECT
  (SELECT COUNT(*) FROM exemption_patterns) as patterns,
  (SELECT COUNT(*) FROM analysis_results) as analyses;
```

---

## 🔧 Troubleshooting

### Issue: "Database connection failed"

**Check:**
1. Environment variables in Vercel are correct
2. Password doesn't have trailing spaces
3. Supabase project is active (not paused)

**Fix:**
- Go to Vercel → Settings → Environment Variables
- Click **Edit** on each variable
- Re-enter values (copy-paste from Supabase)
- Click **Save**
- Redeploy: `vercel --prod`

---

### Issue: "Table does not exist"

**Check:**
1. SQL schema was run successfully in Supabase

**Fix:**
1. Go to Supabase → SQL Editor
2. Run this quick check:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```
3. If no tables shown, re-run the schema SQL from Step 2

---

### Issue: "Can't save data"

**Check:**
1. Row Level Security (RLS) policies are correct
2. Check Supabase logs: Dashboard → Logs → Database

**Fix:**
1. Go to Supabase → Table Editor
2. Click on a table (e.g., exemption_patterns)
3. Click **Add RLS Policy** button
4. Choose: **Enable access for all users**
5. Click **Save**

---

## 🎓 What You Get

✅ **Cloud Hosting**: Web app accessible 24/7 from anywhere
✅ **Cloud Database**: Data stored permanently and safely
✅ **Automatic Backups**: Supabase backs up daily
✅ **Scalability**: Handles 500MB data (50,000+ patterns!)
✅ **Multi-user**: School staff can use simultaneously
✅ **Analytics**: View statistics in Supabase dashboard
✅ **Cost**: FREE (Supabase free tier + Vercel hobby plan)

---

## 📱 Share with School

Send this URL to school staff:
```
https://hkit-course-analyzer-deploy.vercel.app/local/enhanced.html
```

They can:
- Upload transcripts
- Analyze exemptions
- Save results to cloud
- No installation needed
- Works on any device

---

## 🔄 Future Updates

When you make code changes:

```bash
# 1. Make your changes
# 2. Commit and push
git add .
git commit -m "Description of changes"
git push

# 3. Vercel auto-deploys!
# 4. Check: https://hkit-course-analyzer-deploy.vercel.app
```

---

## 💡 Next Steps

After successful setup:

1. **Test thoroughly** - Try multiple transcripts
2. **Train the system** - More analyses = better AI accuracy
3. **Monitor usage** - Check Supabase dashboard weekly
4. **Get feedback** - Ask school staff for improvement ideas
5. **Backup manually** (optional) - Export data from Supabase monthly

---

## 📞 Support

**Supabase Issues:**
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

**Vercel Issues:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: support@vercel.com

---

**You're all set! 🚀**

Your HKIT Course Analyzer is now:
- ✅ Deployed on Vercel (free cloud hosting)
- ✅ Connected to Supabase (free cloud database)
- ✅ Accessible from anywhere
- ✅ Saving all analysis results
- ✅ Learning and improving over time

**Total cost: $0/month** 🎉
