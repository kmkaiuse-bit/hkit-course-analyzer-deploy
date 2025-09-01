/**
 * Tests for streaming response system with job ID tracking
 */
const { 
  createMockVercelRequest, 
  createMockVercelResponse,
  createMediumMockPDF,
  generateMockJobId
} = require('../../utils/mockHelpers');

// Mock the Gemini API module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

const chunkedHandler = require('../../../src/api/gemini-chunked');
const statusHandler = require('../../../src/api/gemini-status');

describe('Streaming Response System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
    chunkedHandler.jobs.clear();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('Job ID Generation and Tracking', () => {
    test('should generate unique job IDs', async () => {
      const jobIds = new Set();
      
      // Generate multiple job IDs
      for (let i = 0; i < 100; i++) {
        const jobId = generateMockJobId();
        expect(jobIds.has(jobId)).toBe(false);
        jobIds.add(jobId);
      }
      
      expect(jobIds.size).toBe(100);
    });

    test('should create job with proper structure', async () => {
      const req = createMockVercelRequest({
        prompt: 'Test prompt',
        files: [
          {
            name: 'medium.pdf',
            mimeType: 'application/pdf',
            data: Buffer.from('x'.repeat(600 * 1024)).toString('base64') // 600KB
          }
        ]
      });
      const res = createMockVercelResponse();

      // Mock successful response
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify([{"HKIT Subject Code": "HD101"}])
          }
        })
      });

      require('@google/generative-ai').GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await chunkedHandler(req, res);

      // Verify job was created
      const responseCall = res.json.mock.calls[0][0];
      const jobId = responseCall.jobId;
      
      expect(chunkedHandler.jobs.has(jobId)).toBe(true);
      
      const job = chunkedHandler.jobs.get(jobId);
      expect(job).toMatchObject({
        id: jobId,
        status: expect.stringMatching(/processing|completed/),
        totalChunks: expect.any(Number),
        completedChunks: expect.any(Number),
        results: expect.any(Array),
        createdAt: expect.any(Number)
      });
    });
  });

  describe('Progressive Result Streaming', () => {
    test('should return partial results immediately for chunked processing', async () => {
      const files = Array.from({ length: 6 }, (_, i) => ({
        name: `file${i}.pdf`,
        mimeType: 'application/pdf',
        data: Buffer.from(`content ${i}`).toString('base64')
      }));

      const req = createMockVercelRequest({
        prompt: 'Test prompt',
        files,
        chunkSize: 2
      });
      const res = createMockVercelResponse();

      // Mock successful response
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify([{
              "HKIT Subject Code": "HD101",
              "HKIT Subject Name": "Test Course"
            }])
          }
        })
      };

      require('@google/generative-ai').GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await chunkedHandler(req, res);

      const responseCall = res.json.mock.calls[0][0];
      
      expect(responseCall).toMatchObject({
        success: true,
        jobId: expect.any(String),
        partial: true,
        progress: {
          completed: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        },
        data: expect.any(Array)
      });

      // First chunk should be completed immediately
      expect(responseCall.progress.completed).toBeGreaterThan(0);
      expect(responseCall.data.length).toBeGreaterThan(0);
    });

    test('should track progress correctly during streaming', async () => {
      // Create a job manually for testing
      const jobId = 'test-streaming-job';
      const job = {
        id: jobId,
        status: 'processing',
        totalChunks: 3,
        completedChunks: 1,
        results: [
          {
            chunkIndex: 0,
            completed: true,
            data: [{"HKIT Subject Code": "HD101", "HKIT Subject Name": "Course 1"}]
          },
          {
            chunkIndex: 1,
            completed: false,
            error: 'Processing...'
          }
        ],
        createdAt: Date.now()
      };

      chunkedHandler.jobs.set(jobId, job);

      const statusReq = createMockVercelRequest({ jobId });
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      const responseCall = statusRes.json.mock.calls[0][0];
      
      expect(responseCall).toMatchObject({
        success: true,
        jobId,
        status: 'processing',
        progress: {
          completed: 1,
          total: 3,
          percentage: 33.333333333333336
        },
        completed: false,
        results: [{"HKIT Subject Code": "HD101", "HKIT Subject Name": "Course 1"}]
      });
    });
  });

  describe('Job Completion Detection', () => {
    test('should detect when all chunks are completed', async () => {
      const jobId = 'completed-job-test';
      const job = {
        id: jobId,
        status: 'completed',
        totalChunks: 2,
        completedChunks: 2,
        results: [
          {
            chunkIndex: 0,
            completed: true,
            data: [{"HKIT Subject Code": "HD101"}]
          },
          {
            chunkIndex: 1,
            completed: true,
            data: [{"HKIT Subject Code": "HD102"}]
          }
        ],
        createdAt: Date.now()
      };

      chunkedHandler.jobs.set(jobId, job);

      const statusReq = createMockVercelRequest({ jobId });
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      const responseCall = statusRes.json.mock.calls[0][0];
      
      expect(responseCall).toMatchObject({
        success: true,
        jobId,
        status: 'completed',
        completed: true,
        progress: {
          completed: 2,
          total: 2,
          percentage: 100
        },
        results: [
          {"HKIT Subject Code": "HD101"},
          {"HKIT Subject Code": "HD102"}
        ]
      });
    });

    test('should handle partial completion with errors', async () => {
      const jobId = 'partial-error-job';
      const job = {
        id: jobId,
        status: 'completed',
        totalChunks: 3,
        completedChunks: 3,
        results: [
          {
            chunkIndex: 0,
            completed: true,
            data: [{"HKIT Subject Code": "HD101"}]
          },
          {
            chunkIndex: 1,
            completed: false,
            error: 'Timeout error'
          },
          {
            chunkIndex: 2,
            completed: true,
            data: [{"HKIT Subject Code": "HD103"}]
          }
        ],
        createdAt: Date.now()
      };

      chunkedHandler.jobs.set(jobId, job);

      const statusReq = createMockVercelRequest({ jobId });
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      const responseCall = statusRes.json.mock.calls[0][0];
      
      expect(responseCall.completed).toBe(true);
      expect(responseCall.results).toEqual([
        {"HKIT Subject Code": "HD101"},
        {"HKIT Subject Code": "HD103"}
      ]);
      expect(responseCall.errors).toEqual([
        {
          chunkIndex: 1,
          error: 'Timeout error'
        }
      ]);
    });
  });

  describe('Job Lifecycle Management', () => {
    test('should clean up expired jobs', async () => {
      const oldJobId = 'old-job';
      const recentJobId = 'recent-job';
      
      // Create an old job (2 hours ago)
      const oldJob = {
        id: oldJobId,
        status: 'completed',
        createdAt: Date.now() - (2 * 3600000) // 2 hours ago
      };
      
      // Create a recent job
      const recentJob = {
        id: recentJobId,
        status: 'completed', 
        createdAt: Date.now() - 1000 // 1 second ago
      };

      chunkedHandler.jobs.set(oldJobId, oldJob);
      chunkedHandler.jobs.set(recentJobId, recentJob);

      // Try to access old job - should trigger cleanup
      const statusReq = createMockVercelRequest({ jobId: oldJobId });
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      // Old job should be cleaned up and return 404
      expect(statusRes.status).toHaveBeenCalledWith(404);
      
      // Recent job should still exist
      expect(chunkedHandler.jobs.has(recentJobId)).toBe(true);
    });

    test('should handle concurrent job creation', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        req: createMockVercelRequest({
          prompt: `Test prompt ${i}`,
          files: [{
            name: `file${i}.pdf`,
            mimeType: 'application/pdf',
            data: Buffer.from('small content').toString('base64')
          }]
        }),
        res: createMockVercelResponse()
      }));

      // Mock successful responses
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify([{"HKIT Subject Code": "HD101"}])
          }
        })
      };

      require('@google/generative-ai').GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      // Process all requests concurrently
      await Promise.all(
        requests.map(({ req, res }) => chunkedHandler(req, res))
      );

      // All should succeed with unique job IDs
      const jobIds = new Set();
      requests.forEach(({ res }) => {
        const responseCall = res.json.mock.calls[0][0];
        expect(responseCall.success).toBe(true);
        expect(responseCall.jobId).toBeDefined();
        jobIds.add(responseCall.jobId);
      });

      expect(jobIds.size).toBe(5); // All unique
    });
  });

  describe('Error Propagation in Streaming', () => {
    test('should propagate chunk errors in status response', async () => {
      const jobId = 'error-job-test';
      const job = {
        id: jobId,
        status: 'processing',
        totalChunks: 2,
        completedChunks: 2,
        results: [
          {
            chunkIndex: 0,
            completed: true,
            data: [{"HKIT Subject Code": "HD101"}]
          },
          {
            chunkIndex: 1,
            completed: false,
            error: 'API rate limit exceeded'
          }
        ],
        createdAt: Date.now()
      };

      chunkedHandler.jobs.set(jobId, job);

      const statusReq = createMockVercelRequest({ jobId });
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      const responseCall = statusRes.json.mock.calls[0][0];
      
      expect(responseCall.errors).toEqual([
        {
          chunkIndex: 1,
          error: 'API rate limit exceeded'
        }
      ]);
    });
  });
});