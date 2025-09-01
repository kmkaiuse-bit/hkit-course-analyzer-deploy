/**
 * Tests for PDF chunking and background processing system
 */
const { 
  createMockVercelRequest, 
  createMockVercelResponse, 
  createSmallMockPDF,
  createLargeMockPDF,
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
const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('Chunked Processing System', () => {
  let mockModel;
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock environment
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    // Create mock model
    mockModel = {
      generateContent: jest.fn()
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    // Create mock request/response
    req = createMockVercelRequest({
      prompt: 'Test chunking prompt',
      files: []
    });
    
    res = createMockVercelResponse();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    // Clear jobs map
    chunkedHandler.jobs.clear();
  });

  describe('Small File Processing (No Chunking)', () => {
    test('should process small files immediately without chunking', async () => {
      const smallFile = {
        name: 'small.pdf',
        mimeType: 'application/pdf',
        data: Buffer.from('small content').toString('base64')
      };

      req.body.files = [smallFile];

      const mockResponse = {
        response: {
          text: () => JSON.stringify([{
            "HKIT Subject Code": "HD101",
            "HKIT Subject Name": "Test Course",
            "Exemption Granted": "TRUE"
          }])
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await chunkedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        jobId: expect.any(String),
        completed: true,
        data: expect.any(Array)
      });
    });
  });

  describe('Large File Chunking', () => {
    test('should create job for large files requiring chunking', async () => {
      const largeFileData = 'x'.repeat(600 * 1024); // 600KB
      const largeFile = {
        name: 'large.pdf', 
        mimeType: 'application/pdf',
        data: Buffer.from(largeFileData).toString('base64')
      };

      req.body.files = [largeFile];

      const mockResponse = {
        response: {
          text: () => JSON.stringify([{
            "HKIT Subject Code": "HD101",
            "HKIT Subject Name": "Test Course"
          }])
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await chunkedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        jobId: expect.any(String),
        completed: expect.any(Boolean),
        partial: true,
        progress: {
          completed: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        },
        data: expect.any(Array)
      });
    });

    test('should handle multiple files by chunking', async () => {
      const files = Array.from({ length: 8 }, (_, i) => ({
        name: `file${i}.pdf`,
        mimeType: 'application/pdf',
        data: Buffer.from(`content ${i}`).toString('base64')
      }));

      req.body.files = files;
      req.body.chunkSize = 3; // 3 files per chunk

      const mockResponse = {
        response: {
          text: () => JSON.stringify([{
            "HKIT Subject Code": "HD101",
            "HKIT Subject Name": "Test Course"
          }])
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await chunkedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall.success).toBe(true);
      expect(responseCall.jobId).toBeDefined();
      expect(responseCall.progress.total).toBeGreaterThan(1); // Should create multiple chunks
    });
  });

  describe('Job Status Checking', () => {
    test('should return job status for valid job ID', async () => {
      // First create a job
      const largeFileData = 'x'.repeat(600 * 1024);
      const largeFile = {
        name: 'large.pdf',
        mimeType: 'application/pdf',
        data: Buffer.from(largeFileData).toString('base64')
      };

      req.body.files = [largeFile];

      const mockResponse = {
        response: {
          text: () => JSON.stringify([{"HKIT Subject Code": "HD101"}])
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await chunkedHandler(req, res);

      // Get the job ID from the response
      const jobId = res.json.mock.calls[0][0].jobId;

      // Now check status
      const statusReq = createMockVercelRequest({ jobId });
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      expect(statusRes.status).toHaveBeenCalledWith(200);
      expect(statusRes.json).toHaveBeenCalledWith({
        success: true,
        jobId,
        status: expect.stringMatching(/processing|completed/),
        progress: {
          completed: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        },
        completed: expect.any(Boolean),
        results: expect.any(Array),
        createdAt: expect.any(Number),
        processingTime: expect.any(Number)
      });
    });

    test('should return 404 for non-existent job ID', async () => {
      const statusReq = createMockVercelRequest({ jobId: 'non-existent-job' });
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      expect(statusRes.status).toHaveBeenCalledWith(404);
      expect(statusRes.json).toHaveBeenCalledWith({
        error: 'Job not found',
        message: 'The specified job ID does not exist or has expired'
      });
    });

    test('should handle GET request with query parameters', async () => {
      // Create a mock job first
      chunkedHandler.jobs.set('test-job-123', {
        id: 'test-job-123',
        status: 'completed',
        totalChunks: 1,
        completedChunks: 1,
        results: [{ completed: true, data: [{ "HKIT Subject Code": "HD101" }] }],
        createdAt: Date.now()
      });

      const statusReq = {
        method: 'GET',
        query: { jobId: 'test-job-123' }
      };
      const statusRes = createMockVercelResponse();

      await statusHandler(statusReq, statusRes);

      expect(statusRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling in Chunking', () => {
    test('should handle timeout in chunk processing', async () => {
      const largeFile = {
        name: 'large.pdf',
        mimeType: 'application/pdf', 
        data: Buffer.from('x'.repeat(600 * 1024)).toString('base64')
      };

      req.body.files = [largeFile];

      // Mock a timeout in generateContent
      mockModel.generateContent.mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            response: { text: () => '[]' }
          }), 9000); // Should timeout
        })
      );

      await chunkedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Should still return success but may have errors in results
      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall.success).toBe(true);
    });

    test('should handle malformed JSON response in chunks', async () => {
      const smallFile = {
        name: 'small.pdf',
        mimeType: 'application/pdf',
        data: Buffer.from('content').toString('base64')
      };

      req.body.files = [smallFile];

      const mockResponse = {
        response: {
          text: () => 'This is not valid JSON'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await chunkedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall.success).toBe(true);
      expect(responseCall.data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          error: 'Failed to parse response'
        })
      ]));
    });
  });

  describe('CORS and Method Handling', () => {
    test('should handle OPTIONS request', async () => {
      req.method = 'OPTIONS';

      await chunkedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    test('should reject invalid HTTP methods', async () => {
      req.method = 'DELETE';

      await chunkedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method not allowed'
      });
    });

    test('should set proper CORS headers', async () => {
      await chunkedHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });
  });
});