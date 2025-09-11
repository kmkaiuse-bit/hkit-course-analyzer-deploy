# Current Problems Analysis

## Problem 1: Hallucination in Extract Results

### Issue Description
The Gemini API sometimes generates inaccurate or "hallucinated" subject mappings that don't match the actual transcript content.

### Root Cause
- The current prompt uses "skills-based matching" approach which is too flexible
- Instruction: "Focus on transferable competencies rather than course titles"
- This causes Gemini to create mappings based on assumed skills rather than actual course names

### Current Prompt Issues
**File:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\assets\js\gemini-api.js` (lines 67-72)
```javascript
- Skills-Based Matching: Focus on transferable competencies (critical thinking, problem-solving, communication, leadership, analysis) rather than course titles
- Language Exemptions: Grant HD401/HD402/HC401/BA50084E for ANY completed English courses; HD405 for ANY Chinese courses
- Content Examples: "Critical Thinking" → "Employability Skills", "Economics" → "Analysis of Real World Issues", "Communication" → "Presentation Skills"
```

### Impact
- Dropdown shows subjects that weren't actually in the transcript
- Learning system stores incorrect mappings
- Users lose trust in the system accuracy

---

## Problem 2: Storage Manager Function Visibility

### Issue Description
Users cannot see when/where the StorageManager functions are triggered and don't know where to find the stored data.

### Where Storage Functions Are Triggered

#### 1. API Analysis Results Storage
**File:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\assets\js\results-display.js` (line 28)
```javascript
StorageManager.recordAnalysisResults(results, studentInfo);
```
**When:** Every time Gemini API returns results
**What's Stored:** All exemption patterns with confidence scores

#### 2. User Edit Corrections Storage  
**File:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\assets\js\modules\editModeController.js` (line 705)
```javascript
this.recordUserCorrections(changes);
```
**When:** User clicks "Save" after editing results
**What's Stored:** User corrections with high confidence (0.9)

#### 3. Individual Pattern Recording
**File:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\assets\js\modules\editModeController.js` (line 800)
```javascript
await StorageManager.recordExemptionPattern(...)
```
**When:** During user correction processing
**What's Stored:** Specific exemption patterns

### Data Storage Location
- **Database Type:** IndexedDB (browser-based)
- **Database Name:** `HKITExemptionDB`
- **Tables:**
  - `exemptionPatterns`: Subject-to-exemption mappings
  - `userDecisions`: Complete edit history  
  - `subjectMappings`: Historical subject mappings
  - `settings`: Configuration data

### UI Visibility Issues

#### Data Management Section
**File:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\assets\js\modules\dataManager.js` (lines 21-28)
**Current Location:** Hidden in Settings section
```javascript
const settingsCard = document.querySelector('.card h2');
if (settingsCard && settingsCard.textContent.includes('Analysis Settings')) {
    // Creates UI here
}
```

**Problem:** May not find the correct element if text doesn't match exactly

#### Missing Feedback
- No visual indication when data is saved
- No confirmation messages
- No way to view stored data without browser DevTools

### How to Access Stored Data Currently
1. Open Browser DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB in left sidebar
4. Find `HKITExemptionDB`
5. Browse the stored tables

---

## Immediate Action Items

### Problem 1 Solutions ✅ IMPLEMENTED
1. **Tighten Gemini Prompt:** ✅ COMPLETED
   - ✅ Removed skills-based matching approach (lines 67-72)
   - ✅ Added "Exact Name Matching" requirement
   - ✅ Added instruction: "Use ONLY the exact course names as they appear in the transcript - DO NOT paraphrase or interpret"
   - ✅ Added rule: "Copy course names EXACTLY as they appear in the original transcript text"

2. **Add Validation:** ✅ COMPLETED
   - ✅ Added `validateExtractedSubjects()` function (lines 445-471)
   - ✅ Detects potentially interpreted subject names
   - ✅ Logs suspicious subjects and all extracted subjects for debugging

### Problem 2 Solutions  
1. **Add Visual Feedback:**
   - Show notifications when data is saved
   - Display database activity indicators
   - Add save confirmations

2. **Improve Data Management UI:**
   - Make it always visible (not dependent on finding specific text)
   - Add "View Stored Data" functionality
   - Show real-time statistics

3. **Add Debug Mode:**
   - Toggle to show all storage operations
   - Display current database contents
   - Show learning progress

---

## Technical Details

### Current Module Structure
```
C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\assets\js\modules\
├── subjectCollector.js     ✅ Working
├── storageManager.js       ❓ Working but invisible
├── dataManager.js         ❓ UI placement issues
├── editModeController.js   ✅ Working 
└── results-display.js     ✅ Working (in parent assets/js/)
```

**Main HTML File:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\enhanced.html`

### Storage Flow
1. **API Response** → `results-display.js` → `StorageManager.recordAnalysisResults()`
2. **User Edits** → `editModeController.js` → `StorageManager.recordUserDecision()`  
3. **Subject Names** → `subjectCollector.js` → `localStorage`

### Key Configuration Files
- **Main HTML:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\enhanced.html`
- **Gemini API Config:** `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\config\api-config-local.js`
- **Backup Files Created:**
  - `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\enhanced-backup-2025-09-05.html`
  - `C:\Users\StevenKok\Desktop\hkit-course-analyzer\local\assets\js\modules-backup-2025-09-05\`

### Database Schema
```javascript
stores: {
    exemptionPatterns: 'exemptionPatterns',    // Main learning data
    userDecisions: 'userDecisions',            // Edit history
    subjectMappings: 'subjectMappings',        // Subject relationships  
    settings: 'settings'                       // Configuration
}
```