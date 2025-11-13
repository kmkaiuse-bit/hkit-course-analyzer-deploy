// File upload endpoint - OpenRouter compatible (uses base64 encoding instead of file management API)
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
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return res.status(500).json({
        error: 'OpenRouter API key not configured',
        details: 'Please set OPENROUTER_API_KEY in environment variables'
      });
    }

    console.log('📤 Processing file upload for OpenRouter...');

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

        console.log(`📦 Encoding ${fileName} as base64...`);

        // Convert to base64 for OpenRouter (inline data approach)
        const base64Data = fileBuffer.toString('base64');

        console.log(`✅ File processed successfully`);

        // Return file data in a format compatible with OpenRouter
        // Instead of a URI, we return base64 data that can be used inline
        return res.status(200).json({
          success: true,
          file: {
            data: base64Data,
            name: fileName,
            mimeType: mimeType,
            sizeBytes: fileBuffer.length,
            displayName: fileName,
            state: 'ACTIVE' // Mimic Google's response format for compatibility
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
