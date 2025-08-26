# 🎓 HKIT Course Analyzer

Advanced Standing Application Processing System for Hong Kong Institute of Technology

## 🚀 Quick Start

### Production (Vercel)
- Main app: `src/index.html`
- Deployment: Auto-deploy from main branch
- API: Vercel Functions handle Gemini API calls

### Local Development
```bash
# Start local server
python -m http.server 8000

# Open in browser - Choose your version:
http://localhost:8000/local/demo.html      # Basic version
http://localhost:8000/local/enhanced.html  # Full features
```

## 📁 Project Structure

```
├── src/                # Production source code
│   ├── index.html     # Main app
│   ├── assets/        # CSS, JS, images
│   ├── api/           # Vercel functions
│   └── config/        # API configurations
│
├── local/             # Local development versions
│   ├── demo.html      # Basic local version
│   ├── enhanced.html  # Full-featured version
│   └── standalone/    # Self-contained package
│
├── docs/              # Documentation
│   ├── CLAUDE.md      # AI assistant guide
│   ├── deployment/    # Deployment guides
│   └── guides/        # Other documentation
│
└── backups/           # Version backups
    └── working-version/  # Latest stable backup
```

## Features

- 📄 PDF transcript parsing with PDF.js
- 🤖 AI-powered course matching (Gemini 1.5-flash)
- 🎓 Multiple programme templates
- 📊 Advanced exemption analysis (50% max rule)
- 🌐 Language course special handling
- 💾 Export to CSV/Excel/PDF
- ✏️ Edit mode for result modification
- 👨‍🎓 Student information management

## Technology Stack

- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- PDF Processing: PDF.js
- AI Analysis: Google Gemini API
- Deployment: Vercel Functions

## Setup Instructions

### Prerequisites
- Node.js 18.x or higher
- Vercel account
- Google Gemini API key

### Local Development
1. Clone the repository
2. Install dependencies (if any)
3. Create a `.env.local` file with your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Run with a local server

### Deployment
This project is configured for deployment on Vercel. The API functions are serverless and located in the `/api` directory.

## Project Structure
```
/
├── api/              # Vercel Functions
│   ├── gemini.js     # Gemini API endpoint
│   └── test.js       # Test endpoint
├── assets/           # Static assets
│   ├── css/          # Stylesheets
│   ├── js/           # JavaScript files
│   └── images/       # Images and outputs
├── config/           # Configuration files
├── index.html        # Main application
└── vercel.json       # Vercel configuration
```

## Usage

1. Open the application in your browser
2. Upload an HKIT transcript PDF
3. Select the target university program
4. Click "Analyze"
5. View and export the results

## Security

- API keys are stored as environment variables
- All sensitive operations are handled server-side
- No credentials are exposed to the client

## License

Private project - All rights reserved

## Support

For issues or questions, please contact the repository owner.
