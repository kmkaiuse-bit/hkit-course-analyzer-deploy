# 🐛 Dropdown Bug Fix Required

## Problem Identified
The dropdown is still showing preset subjects like "Academic English", "Artificial Intelligence", etc., even though we removed the commonSubjects array from the code.

## Root Cause
The browser has cached data in localStorage from previous sessions where commonSubjects were stored.

## Solution
Clear the cached subject data by following these steps:

### Method 1: Clear Browser Storage (Recommended)
1. Open the enhanced.html page
2. Press **F12** to open Developer Tools
3. Go to **Application** tab
4. In the left sidebar, expand **Local Storage**
5. Click on your domain (e.g., `file://` or `localhost`)
6. Find and delete the key: `hkit_collected_subjects`
7. **Refresh the page (Ctrl+F5)**

### Method 2: Use Clear Button (If Available)
1. Go to Settings → Data Management
2. Click "🗑️ 清空科目" (Clear Subjects) button
3. Refresh the page

### Method 3: Add Cache-Busting Code
Add this to the browser console:
```javascript
localStorage.removeItem('hkit_collected_subjects');
if (typeof SubjectCollector !== 'undefined') {
    SubjectCollector.extractedSubjects.clear();
}
location.reload();
```

## Verification
After clearing the cache:
1. Enter Edit Mode
2. Click any dropdown in "Subject Name of Previous Studies"
3. Should only show:
   - "-- 選擇科目或輸入新科目 --" (Choose subject or enter new)
   - "💭 輸入自定義科目..." (Enter custom subject)
   - NO preset subjects

## Prevention
This won't happen again for new users since we've removed the commonSubjects from the code.