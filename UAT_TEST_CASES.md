# HKIT Course Exemption Analyzer - Simplified UAT

**Version:** 2.0 (Simplified for Single Tester)
**Date:** 2025-11-03
**Test Environment:** Production (Vercel)
**Estimated Time:** 30-45 minutes

---

## What You Need

- [ ] Access to Vercel deployment URL: https://your-app.vercel.app
- [ ] 3 sample transcripts:
  - Small text-based PDF (<1MB, ~10 courses)
  - Large image-based/scanned PDF (4-10MB, 7+ pages)
  - CSV or Excel file with course data
- [ ] Chrome browser (latest version)
- [ ] Student info to fill in: name, ID, programme

---

## How to Use This Checklist

1. ✅ Check the box when test **PASSES**
2. ❌ Mark with X and write notes if test **FAILS**
3. Complete tests in order (they build on each other)
4. Total: **18 Essential Tests**

---

## Core Workflow Tests (Must Pass)

### TEST 1: Upload Small PDF ⭐ CRITICAL
**What:** Upload a small text-based PDF transcript

**Steps:**
1. Open the app
2. Click "Choose Files" or drag-and-drop a small PDF (<1MB)
3. Wait for file to appear in file list

**Pass If:**
- [ ] File uploads successfully
- [ ] File name and size displayed correctly
- [ ] "View Transcripts" button appears
- [ ] No errors in console (F12)

**Notes:** _______________________________________________

---

### TEST 2: Upload Large Image-based PDF ⭐ CRITICAL
**What:** Upload a large scanned/image PDF (tests 4.5MB bypass)

**Steps:**
1. Upload an image-based PDF (4-10MB, scanned document)
2. Watch console messages (F12)

**Pass If:**
- [ ] File uploads successfully
- [ ] Console shows: "⚠️ PDF too large for Vercel" (if >4.5MB)
- [ ] Console shows: "Using direct API call"
- [ ] No errors or failures

**Notes:** _______________________________________________

---

### TEST 3: Upload CSV/Excel File
**What:** Upload structured data file

**Steps:**
1. Upload a CSV or Excel file with transcript data
2. Verify file appears in list

**Pass If:**
- [ ] File accepted
- [ ] File listed correctly
- [ ] No errors

**Notes:** _______________________________________________

---

### TEST 4: View Transcripts - First Time ⭐ CRITICAL
**What:** Verify popup works on first click (tests blank popup fix)

**Steps:**
1. After uploading a PDF, click "View Transcripts"
2. Observe popup window immediately

**Pass If:**
- [ ] Popup opens (not blocked)
- [ ] Popup is NOT blank
- [ ] Shows loading message if needed: "⏳ Loading PDF library..."
- [ ] Content appears within 5 seconds
- [ ] Tip message visible at top: "💡 Tip: If you see a blank window..."

**Notes:** _______________________________________________

---

### TEST 5: View Transcripts - All Pages Shown ⭐ CRITICAL
**What:** Verify all pages render (tests 5-page limit removal)

**Steps:**
1. Upload a 7+ page PDF
2. Click "View Transcripts"
3. Wait for rendering to complete
4. Scroll through all pages

**Pass If:**
- [ ] Shows progress: "📄 Rendering page 1 of 7...", "2 of 7...", etc.
- [ ] ALL pages render (count them - should match PDF page count)
- [ ] Each page labeled: "Page X of Y"
- [ ] No message about "and X more pages"

**Notes:** _______________________________________________

---

### TEST 6: Select Programme and Fill Student Info ⭐ CRITICAL
**What:** Fill in required information

**Steps:**
1. Select a programme from "Programme Type" dropdown
2. Fill in student name, ID, and programme in student info section

**Pass If:**
- [ ] Programmes listed in dropdown
- [ ] Selection works
- [ ] Student info fields editable
- [ ] Data saves (doesn't disappear)

**Notes:** _______________________________________________

---

### TEST 7: Run Analysis - Small Transcript ⭐ CRITICAL
**What:** Test AI analysis on simple case

**Steps:**
1. With small PDF uploaded and programme selected
2. Click "Analyze Files"
3. Watch progress

**Pass If:**
- [ ] Progress bar appears
- [ ] Shows "Analyzing..." message
- [ ] Elapsed time counter works (e.g., "5.2s")
- [ ] Analysis completes successfully (<30 seconds)
- [ ] Results table appears with all courses
- [ ] No console errors

**Notes:** _______________________________________________

---

### TEST 8: Run Analysis - Large Image PDF ⭐ CRITICAL
**What:** Test AI can read scanned documents (tests accuracy fix)

**Steps:**
1. Upload large image-based PDF (4-10MB)
2. Select programme
3. Click "Analyze Files"
4. Review results

**Pass If:**
- [ ] Analysis completes successfully
- [ ] All courses from PDF appear in results
- [ ] Course names are REAL (not made-up or fake)
- [ ] Accuracy is good (matches actual transcript content)
- [ ] Console shows direct API call logs

**Notes:** _______________________________________________

---

### TEST 9: Check Exemption Results ⭐ CRITICAL
**What:** Verify results display correctly

**Steps:**
1. After analysis completes, review the results table

**Pass If:**
- [ ] Table shows: HKIT Subject Code, Name, Exemption Status, Previous Subject, Remarks
- [ ] Green ✓ for exemptions, Red ✗ for non-exemptions
- [ ] Credits calculated correctly
- [ ] Remarks explain the decision clearly
- [ ] Summary card shows: total credits, exempted credits, percentage

**Notes:** _______________________________________________

---

### TEST 10: Check Special Exemption Rules
**What:** Verify language exemptions and 50% limit

**Steps:**
1. Look for any English or Chinese courses in results
2. Check exemption percentage in summary

**Pass If:**
- [ ] Any English course → exempted for HD401/HD402/HC401/BA50084E
- [ ] Any Chinese course → exempted for HD405
- [ ] Exemption percentage ≤ 50% (or warning shown if exceeding)
- [ ] Summary shows compliance status

**Notes:** _______________________________________________

---

### TEST 11: Edit Results ⭐ CRITICAL
**What:** Test manual editing capability

**Steps:**
1. Click "Edit Results"
2. Change one exemption from "Exempted" to "" (empty)
3. Change another from "" to "Exempted"
4. Edit remarks for one course
5. Click "Save Changes"

**Pass If:**
- [ ] Edit mode activates
- [ ] Dropdowns appear for exemption status
- [ ] Remarks become editable
- [ ] Changes save successfully
- [ ] Credits recalculate
- [ ] Summary card updates

**Notes:** _______________________________________________

---

### TEST 12: Generate Study Plan
**What:** Create list of courses student needs to take

**Steps:**
1. After analysis, click "Generate Study Plan"
2. Review the generated plan

**Pass If:**
- [ ] Study plan appears
- [ ] Shows only NON-exempted courses
- [ ] Displays course codes, names, credits
- [ ] Total credits calculated correctly

**Notes:** _______________________________________________

---

### TEST 13: Export to CSV ⭐ CRITICAL
**What:** Download results as CSV

**Steps:**
1. Click "Download CSV"
2. Open downloaded file in Excel

**Pass If:**
- [ ] CSV file downloads
- [ ] Filename includes timestamp and student info
- [ ] Opens correctly in Excel
- [ ] All data present and accurate
- [ ] Special characters preserved (Chinese, etc.)

**Notes:** _______________________________________________

---

### TEST 14: Export to Excel ⭐ CRITICAL
**What:** Download formatted Excel application

**Steps:**
1. Click "Download Excel Application"
2. Open downloaded Excel file

**Pass If:**
- [ ] Excel file downloads
- [ ] Professional formatting applied
- [ ] Student info section present
- [ ] Exemption table formatted with colors
- [ ] Summary statistics included
- [ ] Ready for submission

**Notes:** _______________________________________________

---

### TEST 15: Export to PDF ⭐ CRITICAL
**What:** Generate PDF application form

**Steps:**
1. Click "Generate PDF Application"
2. Review generated PDF

**Pass If:**
- [ ] PDF generates successfully
- [ ] HKIT header/branding visible
- [ ] Student info clearly displayed
- [ ] Exemption table formatted properly
- [ ] Page breaks appropriate
- [ ] Print-ready quality

**Notes:** _______________________________________________

---

### TEST 16: Clear All and Restart
**What:** Test reset functionality

**Steps:**
1. Click "Clear All Files"
2. Confirm clear action
3. Upload new file and repeat analysis

**Pass If:**
- [ ] All files removed
- [ ] Results cleared
- [ ] Interface resets to initial state
- [ ] Can start new analysis without refresh

**Notes:** _______________________________________________

---

### TEST 17: Mobile/Responsive Check
**What:** Quick responsive design check

**Steps:**
1. Press F12, toggle device toolbar (mobile view)
2. Navigate through interface

**Pass If:**
- [ ] Layout adapts to small screen
- [ ] Buttons accessible (not too small)
- [ ] Text readable
- [ ] Main functions work

**Notes:** _______________________________________________

---

### TEST 18: Technical Support Link
**What:** Verify footer contact info

**Steps:**
1. Scroll to bottom of page
2. Click technical support email link

**Pass If:**
- [ ] Footer visible with copyright info
- [ ] Technical Support label present
- [ ] Email link: stevenkok@hkit.edu.hk
- [ ] Clicking opens email client (mailto: link)

**Notes:** _______________________________________________

---

## Test Summary

**Date Tested:** _______________
**Tester Name:** _______________
**Browser:** Chrome Version: _______________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Upload Small PDF | ☐ Pass ☐ Fail | |
| 2 | Upload Large Image PDF | ☐ Pass ☐ Fail | |
| 3 | Upload CSV/Excel | ☐ Pass ☐ Fail | |
| 4 | View Transcripts - First Time | ☐ Pass ☐ Fail | |
| 5 | View Transcripts - All Pages | ☐ Pass ☐ Fail | |
| 6 | Programme & Student Info | ☐ Pass ☐ Fail | |
| 7 | Analysis - Small Transcript | ☐ Pass ☐ Fail | |
| 8 | Analysis - Large Image PDF | ☐ Pass ☐ Fail | |
| 9 | Check Exemption Results | ☐ Pass ☐ Fail | |
| 10 | Special Exemption Rules | ☐ Pass ☐ Fail | |
| 11 | Edit Results | ☐ Pass ☐ Fail | |
| 12 | Generate Study Plan | ☐ Pass ☐ Fail | |
| 13 | Export CSV | ☐ Pass ☐ Fail | |
| 14 | Export Excel | ☐ Pass ☐ Fail | |
| 15 | Export PDF | ☐ Pass ☐ Fail | |
| 16 | Clear and Restart | ☐ Pass ☐ Fail | |
| 17 | Mobile/Responsive | ☐ Pass ☐ Fail | |
| 18 | Technical Support Link | ☐ Pass ☐ Fail | |

**Total Passed:** _____ / 18
**Total Failed:** _____ / 18

---

## Overall Assessment

**Ready for Production?**  ☐ YES    ☐ NO    ☐ YES with Minor Issues

**Critical Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Minor Issues Found:**
1. _______________________________________________
2. _______________________________________________

**Additional Comments:**
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

## Quick Bug Report Template (If Needed)

**Bug:** [Short description]
**Test #:** [Which test found it]
**Steps to Reproduce:**
1.
2.
3.

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Screenshot:** [Attach if helpful]
**Severity:** ☐ Critical  ☐ High  ☐ Medium  ☐ Low

---

## Most Critical Tests (Must Pass Before Launch)

These **8 tests** are absolutely critical and must pass:

1. ✅ **Test 1:** Upload Small PDF
2. ✅ **Test 2:** Upload Large Image PDF (tests 4.5MB fix)
3. ✅ **Test 4:** View Transcripts - First Time (tests blank popup fix)
4. ✅ **Test 5:** View Transcripts - All Pages (tests 5-page limit removal)
5. ✅ **Test 6:** Programme & Student Info
6. ✅ **Test 7:** Analysis - Small Transcript
7. ✅ **Test 8:** Analysis - Large Image PDF (tests accuracy fix)
8. ✅ **Test 11:** Edit Results

**If these 8 pass, the app is functional. The rest are important but not blockers.**

---

## Tips for Testing

1. **Clear Browser Cache** before starting if you've tested before
2. **Open Console (F12)** to see detailed logs and errors
3. **Test with REAL transcripts** if possible (anonymize student info)
4. **Take screenshots** of any issues you find
5. **Note performance** - slow is okay, but freezing is not
6. **Try to break it** - upload weird files, click rapidly, etc.

---

## Known Limitations (Not Bugs)

- Learning Database features only work in local mode (not on Vercel)
- Maximum file size: 20MB for PDFs
- Requires internet connection for Gemini API
- Best performance in Chrome browser

---

## Success Criteria

**App is ready for production if:**
- ✅ All 8 critical tests pass
- ✅ At least 15 out of 18 total tests pass
- ✅ No critical bugs found
- ✅ Exports generate correctly
- ✅ Analysis accuracy is good (no fake subjects)
- ✅ Performance is acceptable (<2 min for large files)

**Signature:** _____________________  **Date:** _______________
