const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const busboy = require('busboy');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in environment variables'
      });
    }

    console.log('📤 Starting file upload to Gemini Files API...');

    // Initialize File Manager
    const fileManager = new GoogleAIFileManager(apiKey);

    // Parse multipart form data
    const bb = busboy({ headers: req.headers });
    let fileBuffer = null;
    let fileName = null;
    let mimeType = null;

    bb.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType: fileMimeType } = info;
      fileName = filename;
      mimeType = fileMimeType;

      console.log(`📁 Receiving file: ${filename} (${fileMimeType})`);

      const chunks = [];
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        console.log(`✅ File received: ${fileBuffer.length} bytes`);
      });
    });

    bb.on('finish', async () => {
      try {
        if (!fileBuffer) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload file to Gemini Files API
        console.log(`🚀 Uploading ${fileName} to Gemini...`);

        // For Gemini Files API, we need to save to temp file first
        // since the SDK expects file paths
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const tmpDir = os.tmpdir();
        const tmpFilePath = path.join(tmpDir, fileName);

        // Write to temp file
        fs.writeFileSync(tmpFilePath, fileBuffer);

        // Upload to Gemini Files API
        const uploadResult = await fileManager.uploadFile(tmpFilePath, {
          mimeType: mimeType,
          displayName: fileName,
        });

        // Clean up temp file
        fs.unlinkSync(tmpFilePath);

        console.log(`✅ File uploaded successfully`);
        console.log(`📍 File URI: ${uploadResult.file.uri}`);
        console.log(`📍 File name: ${uploadResult.file.name}`);
        console.log(`📍 File state: ${uploadResult.file.state}`);

        // Wait for file to be processed if needed
        let file = uploadResult.file;
        while (file.state === 'PROCESSING') {
          console.log('⏳ Waiting for file processing...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          file = await fileManager.getFile(file.name);
        }

        if (file.state === 'FAILED') {
          throw new Error('File processing failed');
        }

        console.log('✅ File ready for analysis');

        // Return file information
        return res.status(200).json({
          success: true,
          file: {
            uri: file.uri,
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            displayName: file.displayName,
            state: file.state
          }
        });

      } catch (uploadError) {
        console.error('❌ Upload error:', uploadError);
        console.error('Error name:', uploadError.name);
        console.error('Error message:', uploadError.message);
        console.error('Error stack:', uploadError.stack);

        return res.status(500).json({
          error: 'File upload failed',
          details: uploadError.message,
          errorType: uploadError.name,
          hasApiKey: !!process.env.GEMINI_API_KEY,
          timestamp: new Date().toISOString()
        });
      }
    });

    bb.on('error', (error) => {
      console.error('Busboy error:', error);
      return res.status(500).json({
        error: 'File parsing failed',
        details: error.message
      });
    });

    // Pipe request to busboy
    req.pipe(bb);

  } catch (error) {
    console.error('General error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
};
