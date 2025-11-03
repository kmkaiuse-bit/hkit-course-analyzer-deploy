# HKIT Course Exemption Analyzer - User Guide

## Quick Start Guide for Staff

**System URL**: https://hkit-course-analyzer-deploy.vercel.app/

---

## What This System Does

The HKIT Course Exemption Analyzer automatically analyzes student transcripts and recommends which courses can be exempted based on their previous studies. Results can be saved to a cloud database to help improve future recommendations.

---

## Step-by-Step Instructions

### Step 1: Access the System

1. Open your web browser (Chrome, Firefox, Edge, or Safari)
2. Go to: **https://hkit-course-analyzer-deploy.vercel.app/**
3. Wait for the page to load completely

### Step 2: Enter Student Information

Fill in the student details in the form:

- **Student ID**: Enter the student's ID number
- **Student Name**: Enter full name
- **Email**: Enter student's email address
- **Phone**: Enter contact number
- **Programme**: Select the programme the student is applying to (e.g., BEng Computing, BBA Accounting)
- **Application Date**: Select today's date or application submission date

**Important**: All fields are required before you can proceed.

### Step 3: Upload Transcript

1. Click the **"Upload PDF"** button or drag-and-drop the transcript file
2. Select the student's transcript PDF file from your computer
3. Wait for the file to upload (you'll see the filename displayed)

**Supported Format**: PDF files only

### Step 4: Analyze the Transcript

1. Click the **"Analyze Files"** button
2. Wait for the analysis to complete (typically 10-60 seconds depending on transcript size)
3. A progress message will show: "Analyzing transcript..."

**What happens during analysis:**
- AI extracts all courses from the transcript
- Each course is compared against HKIT programme requirements
- System recommends exemptions based on content similarity
- Results follow HKIT exemption rules (50% maximum exemptions, language course requirements, etc.)

### Step 5: Review Results

After analysis completes, you'll see a results table showing:

**For each course:**
- **Subject Code**: HKIT course code (e.g., CMT4321)
- **Subject Name**: HKIT course name
- **Previous Studies**: The transcript course that matches
- **Exemption Status**:
  - "TRUE" = Exemption recommended
  - "FALSE" = Must study this course
- **Reason**: Why the decision was made

**Summary Statistics:**
- Total courses analyzed
- Number of exemptions granted
- Percentage of exemptions (should not exceed 50%)

### Step 6: Edit Results (Optional)

If you need to modify the AI's recommendations:

1. Click the **"Edit Results"** button
2. Modify any field directly in the table:
   - Change exemption status (TRUE/FALSE)
   - Update reasons
   - Edit matched courses
3. Click **"Save Changes"** when done
4. Click **"Cancel Edit"** to discard changes

**Note**: The system will auto-correct if total exemptions exceed 50%.

### Step 7: Save to Database

**Important**: This step saves the analysis results to the cloud database, which helps improve future AI predictions.

1. Click the **"Save to Database"** button
2. Review the confirmation dialog that shows:
   - How many subjects will be exempted
   - How many subjects need to be studied
   - Sample decisions
   - Storage location (Supabase Cloud)
3. Click **"OK"** to confirm and save
4. Click **"Cancel"** if you want to make changes first

**Confirmation Dialog Example:**
```
Save Analysis Results to Cloud Database?

You're about to save 8 course exemption decisions:

  8 subjects will be EXEMPTED
  0 subjects need to be STUDIED

Example decisions:
   • HD401: LAN4442 English → EXEMPTED
   • CS402: CMT4321 Advanced Programming → EXEMPTED

Storage Location: Supabase Cloud Database

Why save? This helps improve AI predictions for future students.

Do you want to proceed?
```

**What gets saved:**
- All exemption decisions
- Matched courses from transcript
- Student programme context
- Decision timestamps

**Benefits of saving:**
- Builds learning database
- Improves AI accuracy over time
- Creates consistent exemption patterns
- Helps with future similar cases

### Step 8: Export Results

You can export the analysis in multiple formats:

**CSV Export**:
1. Click **"Export to CSV"** button
2. File downloads automatically (e.g., `exemption_analysis_20251103.csv`)
3. Open in Excel or Google Sheets

**Excel Export**:
1. Click **"Export to Excel"** button
2. File downloads as `.xlsx` format
3. Includes all data with proper formatting

**PDF Export**:
1. Click **"Export to PDF"** button
2. Professional PDF report is generated
3. Suitable for printing and student records

**What's included in exports:**
- Student information
- Complete analysis results
- Exemption summary
- Study plan (courses to take)
- Analysis date and timestamp

---

## Understanding the Results

### Exemption Statuses

- **TRUE (Exempted)**: Student has sufficient prior learning, doesn't need to study this HKIT course
- **FALSE (Not Exempted)**: Student must study this HKIT course

### Exemption Rules

The system follows these HKIT policies:

1. **Maximum 50% Exemptions**: Students can be exempted from at most 50% of programme courses
2. **Language Requirements**: English courses have special handling based on programme requirements
3. **Content Similarity**: Courses must have substantial content overlap (typically 60%+ similarity)
4. **Pass Grades Only**: Only courses with passing grades are considered for exemption

### Common Reasons for Exemption

- "Strong content overlap with [Course Name]"
- "Covers core concepts of [HKIT Course]"
- "Equivalent to [HKIT Course] based on syllabus comparison"

### Common Reasons for No Exemption

- "Insufficient content match with HKIT requirements"
- "Different focus or scope than [HKIT Course]"
- "50% exemption limit reached"
- "Below passing grade threshold"

---

## Database Features

### Why Save to Database?

1. **Improves AI Accuracy**: Your decisions help train the system
2. **Creates Consistency**: Similar cases get similar treatment
3. **Builds Knowledge Base**: Future analyses benefit from your expertise
4. **Audit Trail**: All decisions are tracked with timestamps

### What Happens to Saved Data?

**Saved to Cloud Database**:
- Supabase PostgreSQL cloud database
- Automatic backups
- Secure storage with access controls
- Used for pattern recognition and AI improvement

**Data Retention**:
- Indefinitely stored for learning purposes
- Can be reviewed by administrators
- Contributes to system-wide improvement

### Privacy & Security

- Student personal data can be omitted if desired
- Database has Row Level Security (RLS) policies
- Only authorized staff can access the database
- HTTPS encryption for all data transmission

---

## Troubleshooting

### Problem: Analysis Takes Too Long

**Solution**:
- Wait up to 60 seconds for large transcripts
- Check your internet connection
- Refresh the page and try again
- For very large files (>20 pages), consider splitting the analysis

### Problem: "Save to Database" Button Not Visible

**Solution**:
- Ensure analysis completed successfully
- Results must be displayed on screen
- If in edit mode, save edits first before saving to database

### Problem: Wrong Programme Selected

**Solution**:
- You cannot change programme after analysis
- Click "Clear All" button to start over
- Re-enter student information with correct programme
- Run analysis again

### Problem: Too Many Exemptions (>50%)

**Solution**:
- The system should automatically limit to 50%
- If you manually edited results, check the exemption count
- System prioritizes most important course exemptions
- Some courses may need to be changed from TRUE to FALSE

### Problem: Export Doesn't Work

**Solution**:
- Ensure analysis is complete before exporting
- Check browser allows downloads from this site
- Try a different export format (CSV, Excel, or PDF)
- Clear browser cache and try again

### Problem: Database Save Fails

**Possible Causes**:
- Internet connection lost
- Cloud database temporarily unavailable
- No analysis results to save

**Solution**:
- Check internet connection
- Try saving again after a minute
- Export results as backup (CSV/Excel)
- Contact technical support if problem persists

---

## Tips for Best Results

### Before Analyzing

1. **Verify Transcript Quality**: Ensure PDF is clear and text is readable (not scanned image)
2. **Complete Student Info**: Fill all fields accurately before uploading
3. **Select Correct Programme**: Double-check programme selection matches student's application

### During Review

1. **Read AI Reasoning**: Check the "Reason" column to understand each decision
2. **Verify Content Match**: Ensure matched courses actually align with HKIT course objectives
3. **Check Exemption Total**: Should not exceed 50% of total programme courses
4. **Review Language Courses**: Special attention to English and communication courses

### Before Saving

1. **Final Review**: Double-check all exemption decisions are correct
2. **Confirm Student Info**: Verify student details are accurate
3. **Check Summary**: Review total exemptions vs. total courses
4. **Save Confidently**: Only save when you're satisfied with results

### After Saving

1. **Export for Records**: Always export results after saving to database
2. **Inform Student**: Send exported PDF to student via email
3. **File Documentation**: Save exported files in student records system

---

## Keyboard Shortcuts

- **Ctrl + S**: Save edits (when in edit mode)
- **Esc**: Cancel edit mode
- **F5**: Refresh page (clears all data)

---

## Frequently Asked Questions

### Q1: Do I need an API key?

**A**: No, the system is fully configured. Just open the website and start using it.

### Q2: How long are results stored in the database?

**A**: Indefinitely. Results contribute to improving AI accuracy for future analyses.

### Q3: Can I delete saved results from the database?

**A**: Contact technical support for database modifications. Regular users cannot delete saved data.

### Q4: Can I analyze multiple students at once?

**A**: No, analyze one student at a time. You must complete and clear each analysis before starting the next.

### Q5: What if the AI makes a wrong decision?

**A**: Use the "Edit Results" feature to correct any incorrect recommendations before saving or exporting.

### Q6: Is my data secure?

**A**: Yes. All data is transmitted over HTTPS and stored in a secure cloud database with access controls.

### Q7: Can I use this system offline?

**A**: No, internet connection is required for AI analysis and database features.

### Q8: What programmes are currently supported?

**A**: The system currently supports 6 HKIT programmes. More programmes will be added as course data becomes available.

---

## Getting Help

### Technical Support

**Email**: stevenkok@hkit.edu.hk

**Include in your support request**:
- Description of the problem
- Student ID (if applicable)
- Screenshots of error messages
- Steps you took before the problem occurred

### Training

For hands-on training sessions, contact your Programme Leader or IT department.

---

## System Information

**Production URL**: https://hkit-course-analyzer-deploy.vercel.app/
**Version**: 2.0 (Supabase Integration)
**Last Updated**: November 2025
**Status**: Production Ready

---

## Quick Reference Card

```
BASIC WORKFLOW:
1. Enter student info
2. Upload transcript PDF
3. Click "Analyze Files"
4. Review results
5. (Optional) Click "Edit Results" to modify
6. Click "Save to Database" to save
7. Click export button (CSV/Excel/PDF)

KEY BUTTONS:
- "Analyze Files" = Start analysis
- "Edit Results" = Modify decisions
- "Save to Database" = Save to cloud
- "Export to CSV/Excel/PDF" = Download results
- "Clear All" = Start over

REMEMBER:
- Maximum 50% exemptions
- Save to database helps AI learn
- Export for student records
- Review before saving
```

---

**End of User Guide**

For additional documentation, see:
- README.md (Technical overview)
- SUPABASE_VERCEL_SETUP_SOP.md (Setup instructions)
- PROJECT_PROGRESS_REPORT.html (Project status)
