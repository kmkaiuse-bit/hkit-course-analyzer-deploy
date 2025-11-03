# HKIT Course Exemption Analyzer - UAT Test Cases

**Version:** 1.0
**Date:** 2025-11-03
**Test Environment:** Production (Vercel) & Local Mode

---

## Test Environment Setup

### Prerequisites
- [ ] Access to Vercel deployment URL
- [ ] Sample transcript files (PDF, CSV, Excel)
- [ ] Test API key for local mode (if applicable)
- [ ] Multiple browsers for cross-browser testing (Chrome, Firefox, Edge, Safari)
- [ ] Different file sizes (small <1MB, medium 1-4MB, large 4-20MB)

---

## 1. File Upload & Processing

### TC-001: Upload PDF Transcript (Text-based)
**Priority:** High
**Objective:** Verify text-based PDF upload and extraction

**Steps:**
1. Navigate to the analyzer page
2. Click "Choose Files" or drag-and-drop a text-based PDF transcript
3. Observe file processing

**Expected Results:**
- [ ] File appears in the file list with correct name and size
- [ ] "View Transcripts" button becomes visible
- [ ] Subject extraction completes successfully
- [ ] All courses from PDF are extracted and displayed
- [ ] No errors in console

**Test Data:** Text-based academic transcript PDF (< 4MB)

---

### TC-002: Upload PDF Transcript (Image-based/Scanned)
**Priority:** High
**Objective:** Verify image-based PDF upload and OCR processing

**Steps:**
1. Navigate to the analyzer page
2. Upload a scanned/image-based PDF transcript (4-20MB)
3. Observe processing

**Expected Results:**
- [ ] File uploads successfully
- [ ] System detects large file size (>4.5MB)
- [ ] Automatically switches to direct Gemini API (bypasses Vercel limit)
- [ ] Console shows: "⚠️ PDF too large for Vercel"
- [ ] AI successfully reads and extracts courses from images
- [ ] Loading time indicator shows elapsed time
- [ ] All courses extracted accurately

**Test Data:** Scanned academic transcript PDF (4-20MB, image-based)

---

### TC-003: Upload Excel/CSV Transcript
**Priority:** High
**Objective:** Verify Excel and CSV file processing

**Steps:**
1. Upload an Excel (.xlsx) file with transcript data
2. Upload a CSV file with transcript data

**Expected Results:**
- [ ] Both file types accepted
- [ ] Data extracted correctly
- [ ] Course codes, names, and credits parsed properly
- [ ] Special characters handled correctly
- [ ] Multi-line cells processed correctly

**Test Data:** Excel/CSV files with course data

---

### TC-004: Upload Multiple Files
**Priority:** Medium
**Objective:** Verify multi-file integration mode

**Steps:**
1. Enable "Multi-file Integration Mode" checkbox
2. Upload 2-3 transcript files (mix of PDF, CSV, Excel)
3. Observe file list

**Expected Results:**
- [ ] All files appear in file list
- [ ] Each file shows correct name, type, and size
- [ ] Files can be viewed individually
- [ ] Remove button (❌) works for each file
- [ ] "Clear All Files" button appears and works

---

### TC-005: Large File Handling (>20MB)
**Priority:** Medium
**Objective:** Verify error handling for oversized files

**Steps:**
1. Attempt to upload a PDF larger than 20MB

**Expected Results:**
- [ ] Error message displayed: "PDF file too large: [filename]. Maximum size is 20MB."
- [ ] File not added to file list
- [ ] System remains stable

---

### TC-006: Invalid File Type
**Priority:** Low
**Objective:** Verify rejection of unsupported file types

**Steps:**
1. Attempt to upload .docx, .txt, or image files

**Expected Results:**
- [ ] Appropriate error message shown
- [ ] File not processed
- [ ] No system crash

---

## 2. View Transcripts Feature

### TC-007: View Transcripts - First Click
**Priority:** High
**Objective:** Verify transcript viewer opens correctly on first attempt

**Steps:**
1. Upload a PDF transcript
2. Click "View Transcripts" button immediately
3. Observe popup window

**Expected Results:**
- [ ] Popup window opens (not blocked)
- [ ] Shows "⏳ Loading PDF library..." if PDF.js not ready
- [ ] Waits for library to load (max 5 seconds)
- [ ] Popup displays content (NOT blank)
- [ ] No need to close and reopen

---

### TC-008: View Transcripts - All Pages Displayed
**Priority:** High
**Objective:** Verify all PDF pages are rendered

**Steps:**
1. Upload a multi-page PDF (7+ pages)
2. Click "View Transcripts"
3. Scroll through the popup window

**Expected Results:**
- [ ] All pages rendered (not limited to 5 pages)
- [ ] Each page labeled "Page X of Y"
- [ ] Progress indicator shows: "📄 Rendering page X of Y..." during load
- [ ] Images clear and readable
- [ ] No "...and X more pages" message

---

### TC-009: View Transcripts - Multiple Files
**Priority:** Medium
**Objective:** Verify tab switching between multiple files

**Steps:**
1. Upload 3 different transcript files
2. Click "View Transcripts"
3. Click on different file tabs

**Expected Results:**
- [ ] Tabs shown for each file with file icon
- [ ] Active tab highlighted
- [ ] Content switches correctly
- [ ] Each file type displays appropriately (PDF as images, CSV as table, text as formatted)

---

## 3. Programme Selection & Settings

### TC-010: Programme Selection
**Priority:** High
**Objective:** Verify programme dropdown population and selection

**Steps:**
1. Observe "Programme Type" dropdown
2. Select different programmes (HD, BA, BSc, Top-up)

**Expected Results:**
- [ ] All programmes listed
- [ ] Programme names clear and accurate
- [ ] Selection persists during session
- [ ] Template info updates based on selection

---

### TC-011: Analysis Mode Selection
**Priority:** Medium
**Objective:** Verify analysis mode switching

**Steps:**
1. Toggle between "HKIT Unified Template" and "Standard CSV Analysis"

**Expected Results:**
- [ ] Both modes available
- [ ] UI updates based on mode
- [ ] Mode persists during session

---

### TC-012: Multi-file Integration Toggle
**Priority:** Low
**Objective:** Verify multi-file mode toggle

**Steps:**
1. Check/uncheck "Multi-file Integration Mode"

**Expected Results:**
- [ ] Checkbox state changes
- [ ] Behavior matches selection (single vs multi-file)

---

## 4. Student Information Management

### TC-013: Fill Student Information
**Priority:** High
**Objective:** Verify student info form functionality

**Steps:**
1. After uploading transcript, locate student info section
2. Fill in: Student Name, Student ID, Programme
3. Save information

**Expected Results:**
- [ ] All fields editable
- [ ] Data saves correctly
- [ ] Info appears in generated reports
- [ ] Special characters handled (Chinese names, etc.)

---

## 5. AI Analysis

### TC-014: Basic Analysis - Small Transcript
**Priority:** High
**Objective:** Verify AI analysis for simple case

**Steps:**
1. Upload a transcript with 5-10 courses
2. Select programme
3. Click "Analyze Files"
4. Observe progress

**Expected Results:**
- [ ] "Analyzing..." message appears
- [ ] Progress bar shows completion percentage
- [ ] Elapsed time counter displays (e.g., "Analyzing... (5.2s)")
- [ ] Analysis completes within reasonable time (<30 seconds)
- [ ] Results displayed in table format
- [ ] No errors

**Test Data:** Small transcript (5-10 courses)

---

### TC-015: Analysis - Large Transcript
**Priority:** High
**Objective:** Verify AI handles large transcripts

**Steps:**
1. Upload transcript with 30+ courses
2. Select programme
3. Click "Analyze Files"

**Expected Results:**
- [ ] Analysis completes successfully
- [ ] All courses analyzed
- [ ] Results table shows all entries
- [ ] Performance acceptable (<2 minutes)
- [ ] No timeout errors

**Test Data:** Large transcript (30+ courses)

---

### TC-016: Analysis - Image-based PDF
**Priority:** High
**Objective:** Verify AI extracts text from scanned PDFs

**Steps:**
1. Upload scanned/image-based PDF
2. Run analysis

**Expected Results:**
- [ ] Console shows direct API call (bypassing Vercel)
- [ ] AI successfully reads course names from images
- [ ] Accuracy comparable to text-based PDFs
- [ ] No "fake subjects" or made-up courses
- [ ] All visible courses extracted

---

### TC-017: Exemption Logic - Language Courses
**Priority:** High
**Objective:** Verify special exemption rules for language courses

**Steps:**
1. Upload transcript with English and Chinese courses
2. Run analysis

**Expected Results:**
- [ ] ANY English course → HD401/HD402/HC401/BA50084E exempted
- [ ] ANY Chinese course → HD405 exempted
- [ ] Justification clearly states language exemption rule

---

### TC-018: Exemption Logic - Skills-based Matching
**Priority:** High
**Objective:** Verify concept-based matching (not just title matching)

**Steps:**
1. Upload transcript with courses like:
   - "Critical Thinking Skills"
   - "Business Economics"
   - "Effective Communication"

**Expected Results:**
- [ ] "Critical Thinking" → "Employability Skills" (matched by skills)
- [ ] "Economics" → "Analysis of Real World Issues" (matched by concepts)
- [ ] "Communication" → "Presentation Skills" (matched by transferable skills)
- [ ] Justification explains the concept match

---

### TC-019: Exemption Logic - Maximum 50% Rule
**Priority:** High
**Objective:** Verify 50% exemption cap enforcement

**Steps:**
1. Upload transcript with many matching courses
2. Run analysis

**Expected Results:**
- [ ] System respects maximum 50% exemption limit
- [ ] Warning shown if limit would be exceeded
- [ ] Summary card shows exemption percentage
- [ ] Visual indicator (red/yellow) if approaching/exceeding limit

---

### TC-020: Analysis Error Handling
**Priority:** Medium
**Objective:** Verify graceful error handling

**Steps:**
1. Simulate API failure (disconnect internet temporarily)
2. Click "Analyze Files"

**Expected Results:**
- [ ] Clear error message displayed
- [ ] No system crash
- [ ] User can retry
- [ ] Console logs error details for debugging

---

## 6. Results Display & Interaction

### TC-021: Results Table Display
**Priority:** High
**Objective:** Verify results table formatting and content

**Steps:**
1. Complete an analysis
2. Review results table

**Expected Results:**
- [ ] Table columns clear: HKIT Subject Code, Name, Exemption Status, Previous Subject, Remarks
- [ ] Green checkmarks (✓) for exemptions
- [ ] Red crosses (✗) for non-exemptions
- [ ] Credits calculated correctly
- [ ] Remarks provide clear justification
- [ ] Table scrollable if many results
- [ ] Responsive design (works on different screen sizes)

---

### TC-022: Summary Card
**Priority:** High
**Objective:** Verify exemption summary statistics

**Steps:**
1. Review summary card after analysis

**Expected Results:**
- [ ] Shows programme name
- [ ] Total programme credits
- [ ] Number of courses exempted
- [ ] Total credits exempted
- [ ] Exemption percentage
- [ ] Visual indicators (colors) for compliance status
- [ ] "Study plan needed for X credits" message

---

### TC-023: View Toggle (Table/JSON)
**Priority:** Low
**Objective:** Verify view switching functionality

**Steps:**
1. Complete analysis
2. Toggle between "Table View" and "JSON View"

**Expected Results:**
- [ ] Both views available
- [ ] Table view: formatted table
- [ ] JSON view: properly formatted JSON
- [ ] Data consistent between views

---

## 7. Edit Mode

### TC-024: Enter Edit Mode
**Priority:** High
**Objective:** Verify edit mode activation

**Steps:**
1. Complete analysis
2. Click "Edit Results" button

**Expected Results:**
- [ ] Edit mode activates
- [ ] "Edit Results" button changes to "Save Changes" and "Cancel"
- [ ] Table becomes editable
- [ ] Dropdowns appear for exemption status
- [ ] Remarks become editable text areas

---

### TC-025: Change Exemption Status
**Priority:** High
**Objective:** Verify manual exemption override

**Steps:**
1. Enter edit mode
2. Change exemption from "Exempted" to "" (empty)
3. Change exemption from "" to "Exempted"
4. Click "Save Changes"

**Expected Results:**
- [ ] Dropdown works correctly
- [ ] Status updates in UI
- [ ] Credits recalculated
- [ ] Summary card updates
- [ ] Warning if 50% limit exceeded

---

### TC-026: Edit Remarks
**Priority:** Medium
**Objective:** Verify remarks editing

**Steps:**
1. Enter edit mode
2. Modify remarks for multiple courses
3. Save changes

**Expected Results:**
- [ ] Remarks field editable
- [ ] Custom text saved
- [ ] Changes persist in exports

---

### TC-027: Add/Remove Rows
**Priority:** Medium
**Objective:** Verify row manipulation

**Steps:**
1. Enter edit mode
2. Click "➕ Add New Row"
3. Fill in new course details
4. Click "❌ Remove" on a row

**Expected Results:**
- [ ] New row appears with empty fields
- [ ] All fields editable
- [ ] Remove button deletes row
- [ ] Credits recalculated after changes

---

### TC-028: Reset to AI Results
**Priority:** Medium
**Objective:** Verify reset functionality

**Steps:**
1. Make several edits
2. Click "Reset to AI Results"
3. Confirm reset

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] After confirm, all changes reverted
- [ ] Original AI results restored
- [ ] Edit mode remains active

---

### TC-029: Cancel Edit Mode
**Priority:** Low
**Objective:** Verify cancel functionality

**Steps:**
1. Make edits
2. Click "Cancel"

**Expected Results:**
- [ ] Changes discarded
- [ ] Returns to view mode
- [ ] Original data shown

---

## 8. Study Plan Generation

### TC-030: Generate Study Plan
**Priority:** High
**Objective:** Verify study plan generation

**Steps:**
1. Complete analysis with some exemptions
2. Click "Generate Study Plan"

**Expected Results:**
- [ ] Study plan generated
- [ ] Lists only non-exempted courses
- [ ] Shows course codes, names, and credits
- [ ] Total credits for study plan calculated
- [ ] Formatted clearly

---

## 9. Export Functions

### TC-031: Export to CSV
**Priority:** High
**Objective:** Verify CSV export functionality

**Steps:**
1. Complete analysis
2. Click "Download CSV"

**Expected Results:**
- [ ] CSV file downloads
- [ ] Filename includes timestamp and student info
- [ ] All columns present
- [ ] Data accurate
- [ ] Opens correctly in Excel/Google Sheets
- [ ] Special characters preserved

---

### TC-032: Export to Excel Application Form
**Priority:** High
**Objective:** Verify Excel export with full application form

**Steps:**
1. Fill student information
2. Complete analysis
3. Click "Download Excel Application"

**Expected Results:**
- [ ] Excel file downloads
- [ ] File contains multiple sheets if applicable
- [ ] Student info section formatted professionally
- [ ] Exemption table formatted with colors
- [ ] Summary statistics included
- [ ] Credits calculated correctly
- [ ] Professional layout suitable for official use

---

### TC-033: Export to PDF Application Form
**Priority:** High
**Objective:** Verify PDF export

**Steps:**
1. Fill student information
2. Complete analysis
3. Click "Generate PDF Application"

**Expected Results:**
- [ ] PDF generates successfully
- [ ] Header includes HKIT logo/branding
- [ ] Student info clearly displayed
- [ ] Exemption table formatted with colors
- [ ] Page breaks appropriate
- [ ] Footer with page numbers
- [ ] Print-ready quality

---

## 10. Learning Database (Local Mode Only)

### TC-034: Save to Learning Database
**Priority:** Medium
**Objective:** Verify pattern recording

**Steps:**
1. Complete analysis (requires local server running)
2. Click "Save to Database"

**Expected Results:**
- [ ] Success message: "X patterns saved to learning database"
- [ ] Console shows successful API calls
- [ ] Database records created/updated

**Prerequisites:** Local server must be running (port 3001)

---

### TC-035: View Learning Dashboard
**Priority:** Medium
**Objective:** Verify dashboard display

**Steps:**
1. Press Ctrl+Shift+L or click learning badge
2. Review dashboard

**Expected Results:**
- [ ] Modal opens with statistics
- [ ] Shows total patterns learned
- [ ] Confidence level distribution
- [ ] Recent patterns listed
- [ ] Close button works

**Prerequisites:** Local mode with database

---

### TC-036: Pattern Auto-Application
**Priority:** Medium
**Objective:** Verify learned patterns are auto-applied

**Steps:**
1. Analyze same transcript twice with learning enabled
2. Compare speed and results

**Expected Results:**
- [ ] Second analysis faster
- [ ] High-confidence patterns (>90%) auto-applied
- [ ] Console shows: "X patterns auto-applied"
- [ ] AI only analyzes new/uncertain courses
- [ ] Results consistent

**Prerequisites:** Local mode with database

---

## 11. User Interface & UX

### TC-037: Floating Control Panel
**Priority:** Low
**Objective:** Verify floating controls functionality

**Steps:**
1. Scroll down the page after uploading files
2. Observe floating control panel

**Expected Results:**
- [ ] Floating panel appears when scrolling
- [ ] Buttons mirror main action buttons
- [ ] All buttons functional
- [ ] Proper positioning (bottom-right)
- [ ] Doesn't obstruct content

---

### TC-038: Progress Indicators
**Priority:** Medium
**Objective:** Verify all loading indicators work

**Steps:**
1. Perform various actions (upload, analyze, export)
2. Observe progress indicators

**Expected Results:**
- [ ] Loading spinners appear during processing
- [ ] Progress bar shows percentage
- [ ] Elapsed time counter displays
- [ ] Status messages clear and accurate
- [ ] No "frozen" appearance

---

### TC-039: Error Messages
**Priority:** Medium
**Objective:** Verify error handling and user feedback

**Steps:**
1. Trigger various errors intentionally
2. Observe error messages

**Expected Results:**
- [ ] Error messages clear and specific
- [ ] Red/warning styling applied
- [ ] User can understand what went wrong
- [ ] Actionable suggestions provided
- [ ] No generic "Error" messages

---

### TC-040: Responsive Design - Mobile
**Priority:** Low
**Objective:** Verify mobile responsiveness

**Steps:**
1. Access app on mobile device or use browser dev tools
2. Navigate through all features

**Expected Results:**
- [ ] Layout adapts to screen size
- [ ] Buttons accessible (not too small)
- [ ] Text readable without zooming
- [ ] Tables scrollable horizontally
- [ ] No overlapping elements

---

### TC-041: Responsive Design - Tablet
**Priority:** Low
**Objective:** Verify tablet display

**Steps:**
1. Access on tablet or simulate tablet view

**Expected Results:**
- [ ] Proper layout on medium screens
- [ ] All features accessible
- [ ] Good use of screen space

---

## 12. Browser Compatibility

### TC-042: Chrome Browser
**Priority:** High
**Objective:** Verify full functionality in Chrome

**Steps:**
1. Test all core features in Chrome (latest version)

**Expected Results:**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Proper rendering

---

### TC-043: Firefox Browser
**Priority:** Medium
**Objective:** Verify compatibility with Firefox

**Steps:**
1. Test all core features in Firefox

**Expected Results:**
- [ ] All features work correctly
- [ ] PDF rendering works
- [ ] File uploads work

---

### TC-044: Edge Browser
**Priority:** Medium
**Objective:** Verify compatibility with Edge

**Steps:**
1. Test all core features in Edge

**Expected Results:**
- [ ] All features work correctly
- [ ] No compatibility issues

---

### TC-045: Safari Browser (Mac/iOS)
**Priority:** Low
**Objective:** Verify Safari compatibility

**Steps:**
1. Test on Safari (if available)

**Expected Results:**
- [ ] Core features work
- [ ] PDF.js loads correctly
- [ ] No webkit-specific issues

---

## 13. Performance Testing

### TC-046: Page Load Time
**Priority:** Medium
**Objective:** Verify acceptable load time

**Steps:**
1. Clear cache
2. Load application
3. Measure time until interactive

**Expected Results:**
- [ ] Page loads in < 3 seconds on good connection
- [ ] Progressive loading (not blank page)
- [ ] CSS/JS loads correctly

---

### TC-047: Large File Processing Speed
**Priority:** Medium
**Objective:** Verify performance with large files

**Steps:**
1. Upload 10MB+ PDF
2. Measure processing time

**Expected Results:**
- [ ] Processes in reasonable time (< 2 minutes)
- [ ] No browser freeze
- [ ] Progress feedback provided

---

### TC-048: Multiple Concurrent Users (Vercel)
**Priority:** Low
**Objective:** Verify Vercel handles concurrent users

**Steps:**
1. Simulate multiple users accessing simultaneously
2. Each performs analysis

**Expected Results:**
- [ ] No performance degradation
- [ ] All requests processed
- [ ] No API rate limiting errors

---

## 14. Security & Data Privacy

### TC-049: API Key Protection (Local Mode)
**Priority:** High
**Objective:** Verify API key storage security

**Steps:**
1. Enter API key in local mode
2. Check browser storage
3. Reload page

**Expected Results:**
- [ ] Key stored in localStorage only
- [ ] Key not visible in network requests (for Vercel mode)
- [ ] Key persists across page reloads
- [ ] Key can be cleared

---

### TC-050: Data Privacy - No Server Storage
**Priority:** High
**Objective:** Verify transcripts not stored on server

**Steps:**
1. Upload sensitive transcript
2. Check network tab for data transmission

**Expected Results:**
- [ ] Transcript sent to Gemini API only
- [ ] No permanent storage on HKIT servers
- [ ] Data cleared after session ends

---

## 15. Edge Cases & Stress Testing

### TC-051: Empty Transcript File
**Priority:** Low
**Objective:** Verify handling of empty files

**Steps:**
1. Upload empty PDF or CSV

**Expected Results:**
- [ ] Graceful error message
- [ ] No crash
- [ ] User can upload different file

---

### TC-052: Special Characters in Course Names
**Priority:** Medium
**Objective:** Verify handling of special characters

**Steps:**
1. Upload transcript with courses containing: &, <, >, ", ', Chinese characters

**Expected Results:**
- [ ] All characters displayed correctly
- [ ] No HTML injection
- [ ] Exports preserve characters

---

### TC-053: Very Long Course Names
**Priority:** Low
**Objective:** Verify UI handles long text

**Steps:**
1. Upload transcript with very long course names (100+ characters)

**Expected Results:**
- [ ] Text wraps appropriately
- [ ] No layout breaking
- [ ] Readable in all views

---

### TC-054: Rapidly Clicking Buttons
**Priority:** Low
**Objective:** Verify debouncing/protection against multiple clicks

**Steps:**
1. Rapidly click "Analyze Files" multiple times

**Expected Results:**
- [ ] Only one analysis triggered
- [ ] Button disabled during processing
- [ ] No duplicate API calls

---

### TC-055: Browser Back Button
**Priority:** Low
**Objective:** Verify behavior with browser navigation

**Steps:**
1. Complete analysis
2. Click browser back button

**Expected Results:**
- [ ] Data preserved or appropriate warning
- [ ] No errors
- [ ] Can return to results

---

## 16. Accessibility

### TC-056: Keyboard Navigation
**Priority:** Low
**Objective:** Verify keyboard-only navigation

**Steps:**
1. Navigate app using only Tab, Enter, and arrow keys

**Expected Results:**
- [ ] All interactive elements reachable
- [ ] Focus indicators visible
- [ ] Logical tab order

---

### TC-057: Screen Reader Compatibility
**Priority:** Low
**Objective:** Basic screen reader testing

**Steps:**
1. Use screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through interface

**Expected Results:**
- [ ] Buttons announced correctly
- [ ] Form fields have labels
- [ ] Status messages readable

---

## 17. Footer & Support

### TC-058: Technical Support Link
**Priority:** Low
**Objective:** Verify support email link works

**Steps:**
1. Scroll to footer
2. Click technical support email link

**Expected Results:**
- [ ] Email client opens (mailto: link)
- [ ] Email address correct: stevenkok@hkit.edu.hk
- [ ] Link styled appropriately

---

## Test Summary Template

### Test Execution Summary

| Category | Total Tests | Passed | Failed | Blocked | Not Tested |
|----------|-------------|---------|--------|---------|------------|
| File Upload | 6 | | | | |
| View Transcripts | 3 | | | | |
| Programme/Settings | 3 | | | | |
| Student Info | 1 | | | | |
| AI Analysis | 7 | | | | |
| Results Display | 3 | | | | |
| Edit Mode | 6 | | | | |
| Study Plan | 1 | | | | |
| Export | 3 | | | | |
| Learning Database | 3 | | | | |
| UI/UX | 5 | | | | |
| Browser Compatibility | 4 | | | | |
| Performance | 3 | | | | |
| Security | 2 | | | | |
| Edge Cases | 5 | | | | |
| Accessibility | 2 | | | | |
| Footer | 1 | | | | |
| **TOTAL** | **58** | | | | |

---

## Critical Path Test Cases (Priority High)

**These must pass before production release:**

1. TC-001: Upload PDF Transcript (Text-based)
2. TC-002: Upload PDF Transcript (Image-based/Scanned)
3. TC-003: Upload Excel/CSV Transcript
4. TC-007: View Transcripts - First Click
5. TC-008: View Transcripts - All Pages Displayed
6. TC-010: Programme Selection
7. TC-013: Fill Student Information
8. TC-014: Basic Analysis - Small Transcript
9. TC-015: Analysis - Large Transcript
10. TC-016: Analysis - Image-based PDF
11. TC-017: Exemption Logic - Language Courses
12. TC-018: Exemption Logic - Skills-based Matching
13. TC-019: Exemption Logic - Maximum 50% Rule
14. TC-021: Results Table Display
15. TC-022: Summary Card
16. TC-024: Enter Edit Mode
17. TC-025: Change Exemption Status
18. TC-030: Generate Study Plan
19. TC-031: Export to CSV
20. TC-032: Export to Excel Application Form
21. TC-033: Export to PDF Application Form
22. TC-042: Chrome Browser
23. TC-049: API Key Protection
24. TC-050: Data Privacy

---

## Known Limitations & Notes

1. **Learning Database Features:** Only available in local mode with PostgreSQL server
2. **File Size Limits:**
   - Vercel mode: 4.5MB effective limit (base64 encoding)
   - Direct API mode: 20MB maximum
3. **Browser Support:** Optimized for Chrome, Firefox, Edge. Safari may have minor issues
4. **PDF.js Dependency:** Requires CDN access for PDF rendering
5. **API Dependency:** Requires Gemini API for analysis

---

## Bug Reporting Template

**Bug ID:** UAT-BUG-XXX
**Test Case:** TC-XXX
**Severity:** Critical / High / Medium / Low
**Priority:** P0 / P1 / P2 / P3

**Description:**
[Clear description of the bug]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Logs:**
[Attach if applicable]

**Environment:**
- Browser: [Chrome 120 / Firefox 121 / etc.]
- OS: [Windows 11 / macOS / etc.]
- Mode: [Vercel / Local]

**Additional Notes:**
[Any other relevant information]

---

## Sign-off

**Tested By:** _____________________
**Date:** _____________________
**Overall Status:** ☐ Pass  ☐ Fail  ☐ Pass with Minor Issues

**Comments:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
