/**
 * Chunked Gemini API Processing for Large Files
 * Handles timeout issues by processing PDFs in chunks
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Simple in-memory store for job tracking (use Vercel KV in production)
const jobs = new Map();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in environment variables'
      });
    }

    const { prompt, files = [], chunkSize = 5 } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }

    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        topP: 0.9,
        topK: 40,
      },
    });

    // Check if we need chunking (large files or many files)
    const needsChunking = files.length > 1 || files.some(file => 
      Buffer.from(file.data, 'base64').length > 500 * 1024 // 500KB
    );

    if (!needsChunking) {
      // Process immediately for small files
      const result = await processChunk(model, prompt, files, 0);
      return res.status(200).json({
        success: true,
        jobId,
        completed: true,
        data: result
      });
    }

    // Create job for chunked processing
    const chunks = chunkFiles(files, chunkSize);
    const job = {
      id: jobId,
      status: 'processing',
      totalChunks: chunks.length,
      completedChunks: 0,
      results: [],
      createdAt: Date.now()
    };

    jobs.set(jobId, job);

    // Process first chunk immediately 
    try {
      const firstChunkResult = await Promise.race([
        processChunk(model, prompt, chunks[0], 0),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Chunk timeout')), 8000)
        )
      ]);

      job.results.push({
        chunkIndex: 0,
        completed: true,
        data: firstChunkResult
      });
      job.completedChunks = 1;

    } catch (error) {
      console.error('First chunk processing failed:', error);
      job.results.push({
        chunkIndex: 0,
        completed: false,
        error: error.message
      });
    }

    // Schedule remaining chunks for background processing
    if (chunks.length > 1) {
      processRemainingChunks(model, prompt, chunks.slice(1), job);
    } else {
      job.status = 'completed';
    }

    return res.status(200).json({
      success: true,
      jobId,
      completed: job.completedChunks === job.totalChunks,
      partial: true,
      progress: {
        completed: job.completedChunks,
        total: job.totalChunks,
        percentage: (job.completedChunks / job.totalChunks) * 100
      },
      data: job.results.filter(r => r.completed).map(r => r.data).flat()
    });

  } catch (error) {
    console.error('Chunked API Error:', error);
    
    return res.status(500).json({
      error: 'Failed to process request',
      message: error.message || 'Unknown error occurred'
    });
  }
};

/**
 * Split files into processable chunks
 */
function chunkFiles(files, maxFilesPerChunk = 5) {
  const chunks = [];
  
  for (let i = 0; i < files.length; i += maxFilesPerChunk) {
    chunks.push(files.slice(i, i + maxFilesPerChunk));
  }
  
  return chunks.length > 0 ? chunks : [[]]; // Ensure at least one chunk
}

/**
 * Process a single chunk of files
 */
async function processChunk(model, prompt, files, chunkIndex) {
  console.log(`Processing chunk ${chunkIndex} with ${files.length} files`);
  
  let contentToGenerate;
  if (files && files.length > 0) {
    const parts = [{ text: prompt }];
    
    files.forEach(file => {
      if (file.mimeType === 'application/pdf') {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      }
    });
    
    contentToGenerate = parts;
  } else {
    contentToGenerate = prompt;
  }
  
  const result = await model.generateContent(contentToGenerate);
  const response = await result.response;
  const text = response.text();
  
  // Parse and return structured data
  try {
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch (parseError) {
    console.error('Failed to parse chunk response:', parseError);
    return [{
      error: 'Failed to parse response',
      chunkIndex,
      rawText: text
    }];
  }
}

/**
 * Process remaining chunks in background (simulated)
 */
async function processRemainingChunks(model, prompt, remainingChunks, job) {
  // In a real implementation, this would use a queue system
  // For now, we'll process sequentially with delays
  
  for (let i = 0; i < remainingChunks.length; i++) {
    const chunkIndex = i + 1; // +1 because first chunk was already processed
    
    try {
      // Add small delay to simulate background processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const chunkResult = await Promise.race([
        processChunk(model, prompt, remainingChunks[i], chunkIndex),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Chunk timeout')), 8000)
        )
      ]);

      job.results.push({
        chunkIndex,
        completed: true,
        data: chunkResult
      });
      
    } catch (error) {
      console.error(`Chunk ${chunkIndex} processing failed:`, error);
      job.results.push({
        chunkIndex,
        completed: false,
        error: error.message
      });
    }
    
    job.completedChunks++;
  }
  
  job.status = 'completed';
  console.log(`Job ${job.id} completed with ${job.completedChunks}/${job.totalChunks} chunks`);
}

// Export jobs map for testing
module.exports.jobs = jobs;