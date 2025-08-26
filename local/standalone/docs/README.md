# 🎓 HKIT Course Analyzer - Local Version

## Quick Start Guide

### 🚀 **Option 1: One-Click Start (Recommended)**
1. Double-click `scripts/start.bat` (Windows)
2. Wait for browser to open automatically
3. Configure your API key when prompted
4. Start analyzing! ✨

### 🖥️ **Option 2: Manual Start**
```bash
# Navigate to the local-version folder
cd C:\Users\StevenKok\Desktop\hkit-course-analyzer\local-version

# Start Python server
python -m http.server 8000

# Open browser to http://localhost:8000
```

### 🔑 **Get Your Free API Key**
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with "AIza...")
5. Enter it when prompted in the app

---

## 📋 **How to Use**

### 1️⃣ **Upload Files**
- Drag & drop or click to upload
- Supports: CSV, Excel, PDF transcripts
- Multiple files supported

### 2️⃣ **Select Programme** 
- Choose from dropdown menu
- Computing, Business, Cybersecurity, etc.

### 3️⃣ **Analyze**
- Click "Analyze Files" 
- Wait for AI processing (30-60 seconds)
- View results in table format

### 4️⃣ **Export Results**
- Download as CSV or JSON
- Print-friendly format available

---

## ⚡ **Features**

✅ **Fully Local** - Works offline (except API calls)  
✅ **No Cloud Dependencies** - Direct API integration  
✅ **Fast Processing** - Optimized for speed  
✅ **Multi-Format Support** - CSV, Excel, PDF  
✅ **Easy Export** - Multiple output formats  
✅ **Secure** - API key stored locally only  

---

## 🛠️ **Requirements**

- **Python 3.6+** (for local server)
- **Modern Browser** (Chrome, Firefox, Edge)
- **Internet Connection** (for AI analysis only)
- **Gemini API Key** (free tier available)

---

## 🐛 **Troubleshooting**

**Problem: "Python not found"**
- Download Python from: https://www.python.org/downloads/
- Make sure to check "Add to PATH" during installation

**Problem: "API key invalid"**  
- Verify key starts with "AIza"
- Check it's enabled in Google Cloud Console
- Try generating a new key

**Problem: "Analysis failed"**
- Check internet connection
- Verify file is not corrupted
- Try with smaller file size

**Problem: "Port in use"**
- Close other local servers
- Script will auto-try next available port
- Or specify different port manually

---

## 📞 **Support**

For help or questions:
1. Check this README first
2. Verify all requirements are met
3. Try with a simple test file
4. Check browser console for errors

---

## 🎯 **What's Different from Cloud Version?**

| Feature | Local Version | Cloud Version |
|---------|---------------|---------------|
| **Deployment** | ✅ No setup needed | ❌ Requires Vercel |
| **Speed** | ✅ Direct API calls | ⚠️ Extra routing |
| **Privacy** | ✅ Fully local | ⚠️ Data through servers |
| **Limitations** | ✅ No timeouts | ❌ 10-second limits |
| **API Key** | ⚠️ User manages | ✅ Server-side |
| **Updates** | ⚠️ Manual download | ✅ Auto-deploy |

---

**🎉 Enjoy your local HKIT Course Analyzer!**
