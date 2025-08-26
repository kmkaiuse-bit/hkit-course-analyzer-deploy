# DEPLOYMENT_GUIDE.md

## 🚀 Deployment Guide

### Local Development Setup

1. **Clone the repository**
2. **Configure API Key** (choose one method):

   **Method A: Environment Variable**
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

   **Method B: Direct Configuration**
   - Open `config/api-config.js`
   - Add your API key to the `apiKey` field
   - **⚠️ Never commit this change!**

3. **Serve locally**
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

### Vercel Deployment

1. **Push to GitHub** (private repository recommended)

2. **Connect to Vercel**
   - Go to vercel.com
   - Import your GitHub repository
   - Configure environment variables

3. **Set Environment Variables in Vercel:**
   ```
   Variable Name: GEMINI_API_KEY
   Value: your-actual-api-key
   ```

4. **Deploy** - Vercel will handle the rest!

### Security Checklist

- [ ] API key removed from source code
- [ ] `.gitignore` configured properly  
- [ ] Repository set to private
- [ ] Environment variables configured in Vercel
- [ ] No sensitive files in repository

### Troubleshooting

**"API key not found" error:**
- Check Vercel environment variables are set
- Verify variable name is exactly `GEMINI_API_KEY`
- Redeploy after adding environment variables

**Local development issues:**
- Ensure you're serving via HTTP, not opening file directly
- Check browser console for specific errors
- Verify API key is valid and has quota
