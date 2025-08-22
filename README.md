# HKIT Course Exemption Analyzer

A modern web application for processing Advanced Standing Applications at Hong Kong Institute of Technology (HKIT).

## 🎯 Features

- **Multi-Programme Support**: Computing, Business Studies, Cybersecurity, Healthcare, Telecommunications, AI
- **AI-Powered Analysis**: Uses Gemini AI for intelligent course matching
- **Multiple File Support**: Upload and analyze multiple transcript files
- **Export Options**: JSON, CSV, filled templates, and summary reports
- **Student Information Management**: Comprehensive student data handling
- **Study Plan Generation**: Automated study plan creation based on exemptions
- **Advanced Export Features**: Enhanced reporting and data export capabilities
- **Edit Mode**: Interactive editing of analysis results
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Progress**: Visual feedback during analysis

## 📁 Project Structure

```
hkit-course-analyzer/
├── index.html                     # Main application
├── debug.html                     # Debug interface
├── config/
│   └── api-config.js              # API configuration
├── assets/
│   ├── css/
│   │   ├── styles.css             # Main application styling
│   │   └── components/            # Component-specific styles
│   ├── images/
│   │   ├── logo.png              # HKIT logo
│   │   └── [analysis files]      # Sample analysis outputs
│   └── js/
│       ├── app.js                 # Main application controller
│       ├── templates.js           # Programme templates
│       ├── utils.js               # Utility functions
│       ├── file-handler.js        # File upload and processing
│       ├── gemini-api.js          # AI integration layer
│       ├── results-display.js     # Results visualization
│       ├── export-manager.js      # Export functionality
│       └── modules/               # Specialized modules
│           ├── advancedExporter.js      # Enhanced export features
│           ├── editModeController.js    # Interactive editing
│           ├── studentInfoManager.js    # Student data management
│           └── studyPlanGenerator.js    # Study plan creation
├── backup/
│   └── [backup files]            # Version backups
├── docs/
│   ├── ERROR_ANALYSIS.md          # Error tracking and analysis
│   ├── iteration.md               # Development iterations
│   ├── file_structure.md          # Project structure documentation
│   └── 5 hours action.md          # Development action plan
└── README.md                      # This file
```

## 🚀 Quick Start

### 1. Setup API Key
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open `config/api-config.js`
3. Replace the empty `apiKey` field with your key:
   ```javascript
   apiKey: 'your-gemini-api-key-here'
   ```

### 2. Run the Application
1. Open `index.html` in a modern web browser
2. Or serve via a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

### 3. Use the Application
1. **Upload Files**: Drag & drop or select CSV/Excel transcript files
2. **Enter Student Info**: Complete student details form
3. **Select Programme**: Choose the target HKIT programme
4. **Analyze**: Click "Analyze Files" to process with AI
5. **Review & Edit**: Use edit mode to refine results
6. **Generate Study Plan**: Create personalized study plans
7. **Export**: Download results in various formats

## 🧩 Core Modules

### Main Application (`assets/js/`)
- **app.js**: Central application controller and state management
- **file-handler.js**: File upload, validation, and processing
- **gemini-api.js**: AI service integration and communication
- **results-display.js**: Results rendering and visualization
- **export-manager.js**: Basic export functionality
- **templates.js**: Programme course templates and requirements
- **utils.js**: Shared utility functions and helpers

### Specialized Modules (`assets/js/modules/`)
- **studentInfoManager.js**: Student data collection and management
- **editModeController.js**: Interactive result editing capabilities
- **studyPlanGenerator.js**: Automated study plan creation
- **advancedExporter.js**: Enhanced export features and formatting

## 📋 Supported Programmes

1. **Bachelor of Science (Hons) Computing** (12 courses)
2. **Bachelor of Arts (Hons) Business Studies** (11 courses)
3. **Higher Diploma - Cybersecurity** (16 courses)
4. **Higher Diploma in Health Care** (12 courses)
5. **Higher Diploma in Telecommunications and Networking** (12 courses)
6. **Higher Diploma - Artificial Intelligence** (16 courses)

## 📄 File Requirements

- **Supported Formats**: CSV, XLSX, XLS, PDF (including scanned documents)
- **Maximum Size**: 50MB per file
- **Content**: Student transcripts with course names, grades, and credits
- **PDF Processing**: Direct upload to Gemini 2.0 Flash for OCR and analysis
- **Multiple Files**: Supported for comprehensive analysis

## 🔧 Configuration Options

### API Settings (`config/api-config.js`)
- `apiKey`: Your Gemini API key
- `model`: AI model to use (default: gemini-2.0-flash-exp)
- `temperature`: Response creativity (default: 0.1 for consistency)
- `maxTokens`: Maximum response length (default: 8192)

### Analysis Settings
- **Programme Type**: Target HKIT programme
- **Student Information**: Personal and academic details
- **Analysis Mode**: Unified template or standard CSV
- **Multi-file Mode**: Combine multiple transcripts
- **Edit Mode**: Interactive result modification

## 📊 Export Formats

### Standard Exports
1. **JSON**: Complete analysis data for systems integration
2. **CSV**: Spreadsheet format for further processing
3. **Filled Template**: Official HKIT template with results
4. **Summary Report**: Human-readable analysis summary

### Advanced Exports (via advancedExporter.js)
5. **Enhanced PDF Reports**: Formatted PDF with branding
6. **Study Plan Documents**: Structured study progression plans
7. **Statistical Analysis**: Detailed analytics and insights
8. **Batch Export**: Multiple format export in single operation

## 🛠️ Technical Architecture

### Modular Design
- **Separation of Concerns**: Each module handles specific functionality
- **Loose Coupling**: Modules communicate through well-defined interfaces
- **Extensibility**: Easy to add new features and modules
- **Maintainability**: Clear code organization and documentation

### Browser Requirements
- Modern browsers supporting ES6+ modules
- JavaScript enabled
- Local file access permissions
- IndexedDB support for local data persistence

### Dependencies
- No external JavaScript libraries required
- Uses native browser APIs and ES6 modules
- Gemini 2.0 Flash API for analysis and PDF OCR
- CSS Grid and Flexbox for responsive layout

### Performance Features
- Client-side processing for privacy and speed
- Efficient file handling up to 50MB
- Real-time progress tracking and feedback
- Optimized memory usage for large files
- Responsive design for all device sizes

## 🔒 Privacy & Security

- **Local Processing**: Files processed in browser, not stored on servers
- **API Communication**: Direct secure communication with Gemini AI only
- **No Data Storage**: No permanent server-side data storage
- **Secure Transport**: HTTPS-only communication with all services
- **Data Encryption**: Sensitive data handled securely in memory

## 🐛 Troubleshooting

### Common Issues

**"API key not configured"**
- Add your Gemini API key to `config/api-config.js`
- Ensure the key has proper permissions for Gemini API

**"Module loading failed"**
- Serve the application via HTTP(S), not file:// protocol
- Check browser console for specific module errors

**"Unsupported file type"**
- Use only CSV, XLSX, XLS, or PDF files
- Verify file extensions and MIME types

**"Analysis failed"**
- Check internet connection and API availability
- Verify API key is valid and has quota remaining
- Ensure file content is readable and properly formatted

**"Export functionality not working"**
- Check if all required modules are loaded
- Verify browser supports required APIs (Blob, URL.createObjectURL)

### Debug Mode
- Access `debug.html` for detailed system information
- Use browser developer tools (F12) for console logs
- Check network tab for API communication issues

### Performance Issues
- Large files (>10MB) may take longer to process
- Multiple concurrent analyses may affect performance
- Consider processing files individually for better results

## 📚 Documentation

- **ERROR_ANALYSIS.md**: Common errors and solutions
- **iteration.md**: Development history and changes
- **file_structure.md**: Detailed project organization
- **5 hours action.md**: Development planning and tasks

## 🔄 Development Workflow

### Adding New Features
1. Create module in `assets/js/modules/`
2. Import and integrate in main application
3. Update templates if needed
4. Test with debug interface
5. Update documentation

### Code Organization
- Keep modules focused on single responsibilities
- Use consistent naming conventions
- Document public interfaces and dependencies
- Maintain backward compatibility when possible

## 📝 License

This project is developed for Hong Kong Institute of Technology internal use.

## 📞 Support

For technical support or questions about the HKIT Course Exemption Analyzer:
- Check the documentation files in the project
- Review error logs in browser console
- Contact the IT department for additional assistance

---

**Version**: 2.0.0  
**Last Updated**: August 2025  
**Developed for**: Hong Kong Institute of Technology  
**Architecture**: Modular ES6+ Application