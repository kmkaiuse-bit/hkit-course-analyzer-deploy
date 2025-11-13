# ⚡ OpenRouter Migration Plan - 45 Minutes

**⚠️ TESTING ENVIRONMENT ONLY - NOT FOR PRODUCTION**

**Date**: 2025-11-05
**Updated**: 2025-01-05 (Environment Separation)
**Goal**: ~~Migrate from Google Gemini API to OpenRouter API~~ **Use OpenRouter for testing purposes only**
**Timeline**: 45 minutes
**Status**: 🟢 TESTING ONLY - Production uses Gemini

---

## ⚠️ **IMPORTANT: Environment Separation Update**

**As of January 2025**, this migration plan applies to the **TESTING ENVIRONMENT ONLY**.

### Current Status:
- ✅ **Production (Vercel)**: Uses Gemini API (stable, original provider)
- ✅ **Testing (Local)**: Uses OpenRouter API (experimental, local development)

### Environment Files:
- **Production**: `index.html` → `config/api-config.production.js` → Gemini via Vercel Functions
- **Testing**: `local/enhanced.html` → `config/api-config.testing.js` → OpenRouter (optional)

### Related Documentation:
- **[ENVIRONMENT_SEPARATION_PLAN.md](./ENVIRONMENT_SEPARATION_PLAN.md)** - Environment separation implementation
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Setup guide for both environments
- **[SECURITY_AUDIT_2025-01-05.md](./SECURITY_AUDIT_2025-01-05.md)** - Security audit report

---

## **Overview**

**TESTING ENVIRONMENT ONLY**: Use OpenRouter API in local testing environment while:
- Using the same model: `google/gemini-2.5-pro`
- Keeping all existing Gemini code (for production use)
- Maintaining complete separation from production
- Testing locally only (NEVER deploy OpenRouter to production)

---

## **Phase 1: Setup (3 minutes)**

### ✅ Task 1.1: Update `.env` File
**File**: `.env`
**Action**: Add OpenRouter API key
```bash
# OpenRouter API Configuration (ACTIVE)
OPENROUTER_API_KEY=sk-or-v1-[your-actual-key-here]
```

### ✅ Task 1.2: Update Client Config
**File**: `config/client-api-config.js`
**Action**: Change line 14
```javascript
OPENROUTER_API_KEY: 'sk-or-v1-[your-actual-key-here]',
```

---

## **Phase 2: Backend Migration (5 minutes)**

### ✅ Task 2.1: Update `api/gemini.js`

**Change 1**: Comment out Gemini SDK import (line 1)
```javascript
// const { GoogleGenerativeAI } = require('@google/generative-ai');
```

**Change 2**: Update API key source (line 21)
```javascript
const apiKey = process.env.OPENROUTER_API_KEY;
```

**Change 3**: Replace Gemini request with OpenRouter (lines 50-99)
```javascript
// ========== OPENROUTER (ACTIVE) ==========
const messages = [{ role: 'user', content: [{ type: 'text', text: prompt }] }];

if (files && files.length > 0) {
  files.forEach(f => messages[0].content.push({
    type: 'image_url',
    image_url: { url: `data:${f.mimeType};base64,${f.data}` }
  }));
}

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://hkit-course-analyzer-deploy.vercel.app',
    'X-Title': 'HKIT Course Analyzer'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-pro',
    messages,
    temperature,
    max_tokens: Math.min(maxTokens, 16384)
  })
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
}

const data = await response.json();
const text = data.choices[0].message.content;
// ========== END OPENROUTER ==========
```

---

## **Phase 3: Frontend Migration (15 minutes)**

### ✅ Task 3.1: Update `assets/js/gemini-api.js`

**Change 1**: Update method call (line 282)
```javascript
return await this.makeDirectOpenRouterCall(prompt, processedFiles, apiKey);
```

**Change 2**: Replace `makeDirectGeminiCall` with `makeDirectOpenRouterCall` (lines 288-386)
```javascript
async makeDirectOpenRouterCall(prompt, files, apiKey) {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const messages = [{ role: 'user', content: [{ type: 'text', text: prompt }] }];

  if (files?.length > 0) {
    files.forEach(f => messages[0].content.push({
      type: 'image_url',
      image_url: { url: `data:${f.mimeType};base64,${f.data}` }
    }));
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'HKIT Course Analyzer'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages,
      temperature: 0.3,
      max_tokens: 16384,
      top_p: 0.9,
      top_k: 40
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return { success: true, data: { text: data.choices[0].message.content } };
}
```

**Change 3**: Update `parseResponse` method (line ~607)
```javascript
// Add OpenRouter format check FIRST
if (response.choices?.[0]?.message) {
  console.log('📍 Using OpenRouter format');
  text = response.choices[0].message.content;
}
// Keep existing Vercel format check
else if (response.success && response.data && response.data.text) {
  console.log('📍 Using Vercel function format');
  text = response.data.text;
}
```

### ✅ Task 3.2: Update `local/assets/js/gemini-api.js`
**Action**: Apply the same 3 changes as Task 3.1

---

## **Phase 4: Testing (12 minutes)**

### ✅ Task 4.1: Local Browser Test (6 min)

**Commands**:
```bash
python -m http.server 8000
```

**Test Steps**:
1. Open `http://localhost:8000/local/enhanced.html`
2. Open browser console (F12)
3. Enter OpenRouter API key in config
4. Upload `Test/Cybersecurity/transcript.pdf`
5. Select programme: "Higher Diploma in Cybersecurity"
6. Click "Analyze Files"
7. Wait for results
8. Verify results table displays
9. Check console for errors

**Expected**: ✅ Analysis completes, results display correctly

### ✅ Task 4.2: Vercel Dev Test (6 min)

**Commands**:
```bash
vercel dev
```

**Test Steps**: Same as 4.1 but on `http://localhost:3000/index.html`

---

## **Phase 5: Issue Fixes (5 minutes)**

### Common Issues & Fixes

**Issue**: `Cannot read property 'content'`
```javascript
// Add null checking in parseResponse:
const text = response.choices?.[0]?.message?.content || '';
```

**Issue**: `401 Unauthorized`
- Check API key format: `sk-or-v1-...`
- Verify key is correct in `.env` and `config/client-api-config.js`

**Issue**: `API key not configured`
- Ensure `.env` has `OPENROUTER_API_KEY=...`
- Ensure `config/client-api-config.js` has key

---

## **Phase 6: Documentation (5 minutes)**

### ✅ Task 6.1: Update This File
Mark all tasks as complete and document test results

### ✅ Task 6.2: Create Test Report
Document:
- Test results (pass/fail)
- Any issues encountered
- Performance observations

---

## **Files Modified**

1. ✅ `.env` - Added OPENROUTER_API_KEY
2. ✅ `api/gemini.js` - ~30 lines changed
3. ✅ `assets/js/gemini-api.js` - ~50 lines changed
4. ✅ `local/assets/js/gemini-api.js` - ~50 lines changed
5. ✅ `config/client-api-config.js` - ~1 line changed

**Total**: ~133 lines of code changes

---

## **Rollback Plan**

If anything fails:
```bash
git checkout -- .
```

All changes will be discarded, system reverts to Gemini API.

---

## **Important Notes**

⚠️ **TESTING ENVIRONMENT ONLY** - OpenRouter for `local/enhanced.html` only
⚠️ **PRODUCTION UNCHANGED** - Production continues to use Gemini API via Vercel
⚠️ **ENVIRONMENT SEPARATION** - See ENVIRONMENT_SEPARATION_PLAN.md for details
⚠️ **NO PRODUCTION DEPLOY** - NEVER deploy OpenRouter to production
⚠️ **LOCAL TESTING** - Use `.env.local` or `config/client-api-config.js` for API keys

---

## **Progress Tracking**

- [ ] Phase 1: Setup (3 min)
- [ ] Phase 2: Backend Migration (5 min)
- [ ] Phase 3: Frontend Migration (15 min)
- [ ] Phase 4: Testing (12 min)
- [ ] Phase 5: Issue Fixes (5 min)
- [ ] Phase 6: Documentation (5 min)

**Total Time**: 0 / 45 minutes

---

## **Test Results**

### Local Browser Test
- Status: ⏳ PENDING
- Errors: N/A
- Notes: N/A

### Vercel Dev Test
- Status: ⏳ PENDING
- Errors: N/A
- Notes: N/A

---

## **Next Steps After Testing**

**⚠️ IMPORTANT: OpenRouter is for TESTING ONLY - Do NOT deploy to production**

### Testing Environment (OpenRouter):
1. ✅ Complete local testing in `local/enhanced.html`
2. ✅ Verify OpenRouter integration works correctly
3. ✅ Document any findings or improvements
4. ✅ Keep configuration in `config/api-config.testing.js`
5. ⚠️ NEVER push OpenRouter keys to git (use `.env.local` or gitignored configs)

### Production Environment (Gemini):
1. ✅ Production remains on Gemini API via Vercel Functions
2. ✅ No changes needed to production
3. ✅ Deploy updates via: `git push origin main`
4. ✅ Verify `GEMINI_API_KEY` set in Vercel Dashboard
5. ✅ Test production at: https://hkit-course-analyzer-deploy.vercel.app/

**Current Stage**: Testing environment configured, production unchanged

---

**END OF PLAN**
