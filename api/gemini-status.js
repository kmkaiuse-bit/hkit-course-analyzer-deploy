/**
 * Job Status Endpoint for Chunked Processing
 * Allows frontend to check progress of long-running jobs
 */

// Import jobs map from chunked processor (in production, use Vercel KV)
const { jobs } = require('./gemini-chunked');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get job ID from query params or body
    const jobId = req.method === 'GET' ? req.query.jobId : req.body?.jobId;

    if (!jobId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: jobId' 
      });
    }

    // Find job in store
    const job = jobs.get(jobId);

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: 'The specified job ID does not exist or has expired'
      });
    }

    // Calculate progress
    const progress = {
      completed: job.completedChunks,
      total: job.totalChunks,
      percentage: job.totalChunks > 0 ? (job.completedChunks / job.totalChunks) * 100 : 0
    };

    // Aggregate completed results
    const completedResults = job.results
      .filter(r => r.completed)
      .map(r => r.data)
      .flat();

    // Check for errors
    const errors = job.results
      .filter(r => !r.completed)
      .map(r => ({
        chunkIndex: r.chunkIndex,
        error: r.error
      }));

    // Determine if job is completed
    const isCompleted = job.status === 'completed' || job.completedChunks === job.totalChunks;

    // Clean up completed jobs older than 1 hour
    if (isCompleted && Date.now() - job.createdAt > 3600000) {
      jobs.delete(jobId);
    }

    return res.status(200).json({
      success: true,
      jobId,
      status: isCompleted ? 'completed' : 'processing',
      progress,
      completed: isCompleted,
      results: completedResults,
      errors: errors.length > 0 ? errors : undefined,
      createdAt: job.createdAt,
      processingTime: Date.now() - job.createdAt
    });

  } catch (error) {
    console.error('Status API Error:', error);
    
    return res.status(500).json({
      error: 'Failed to get job status',
      message: error.message || 'Unknown error occurred'
    });
  }
};

/**
 * Cleanup expired jobs (can be called periodically)
 */
function cleanupExpiredJobs() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > maxAge) {
      jobs.delete(jobId);
      console.log(`Cleaned up expired job: ${jobId}`);
    }
  }
}

// Export for testing
module.exports.cleanupExpiredJobs = cleanupExpiredJobs;