/**
 * Chunked OpenRouter API Processing for Large Files
 * Handles timeout issues by processing PDFs in chunks
 */

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
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenRouter API key not configured',
        details: 'Please set OPENROUTER_API_KEY in environment variables'
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

    // Check if we need chunking (large files or many files)
    const needsChunking = files.length > 1 || files.some(file =>
      Buffer.from(file.data, 'base64').length > 500 * 1024 // 500KB
    );

    if (!needsChunking) {
      // Process immediately for small files
      const result = await processChunk(apiKey, prompt, files, 0);
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
        processChunk(apiKey, prompt, chunks[0], 0),
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
      processRemainingChunks(apiKey, prompt, chunks.slice(1), job);
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
 * Process a single chunk of files using OpenRouter
 */
async function processChunk(apiKey, prompt, files, chunkIndex) {
  console.log(`Processing chunk ${chunkIndex} with ${files.length} files`);

  // Prepare message content (OpenAI-compatible format)
  let messageContent;
  if (files && files.length > 0) {
    messageContent = [{ type: 'text', text: prompt }];

    files.forEach(file => {
      if (file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/')) {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.mimeType};base64,${file.data}`
          }
        });
      }
    });
  } else {
    messageContent = prompt;
  }

  // Call OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://hkit-course-analyzer.vercel.app',
      'X-Title': 'HKIT Course Analyzer',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: messageContent }],
      temperature: 0.3,
      max_tokens: 4096,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

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
async function processRemainingChunks(apiKey, prompt, remainingChunks, job) {
  // In a real implementation, this would use a queue system
  // For now, we'll process sequentially with delays

  for (let i = 0; i < remainingChunks.length; i++) {
    const chunkIndex = i + 1; // +1 because first chunk was already processed

    try {
      // Add small delay to simulate background processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const chunkResult = await Promise.race([
        processChunk(apiKey, prompt, remainingChunks[i], chunkIndex),
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