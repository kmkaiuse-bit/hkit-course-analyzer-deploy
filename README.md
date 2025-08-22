# Advanced Standing Tool

A web-based tool for analyzing HKIT course transcripts and determining advanced standing eligibility for various university programs.

## Features

- 📄 PDF transcript parsing
- 🎓 Course credit analysis
- 🏫 Multiple university program support
- 📊 Detailed exemption reports
- 💾 Export results as CSV

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
