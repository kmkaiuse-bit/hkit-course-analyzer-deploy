/**
 * Tests for Gemini API timeout handling and Vercel function optimization
 */
const { createMockVercelRequest, createMockVercelResponse, mockTimeoutResponse } = require('../../utils/mockHelpers');

// Mock the Gemini API module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

// Import the handler after mocking
const geminiHandler = require('../../../src/api/gemini');
const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('Gemini API Timeout Handling', () => {
  let mockModel;
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
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
      prompt: 'Test analysis prompt',
      model: 'gemini-1.5-flash',
      files: []
    });
    
    res = createMockVercelResponse();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('Basic API Function Tests', () => {
    test('should handle successful API call within timeout', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify([{
            "HKIT Subject Code": "HD101",
            "HKIT Subject Name": "Introduction to Computing", 
            "Exemption Granted / study plan": "Exempted",
            "Subject Name of Previous Studies": "Programming I",
            "Exemption Granted": "TRUE",
            "Remarks": "Course content matches"
          }])
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await geminiHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          text: expect.any(String)
        })
      });
    });

    test('should handle timeout with 9-second limit', async () => {
      // Mock a delayed response that exceeds timeout
      mockModel.generateContent.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            response: { text: () => 'delayed response' }
          }), 10000); // 10 seconds - should timeout
        })
      );

      await geminiHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to generate content',
        message: 'Request timeout - please try again with shorter input',
        details: undefined
      });
    });

    test('should handle missing API key', async () => {
      delete process.env.GEMINI_API_KEY;

      await geminiHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in environment variables'
      });
    });

    test('should handle invalid request method', async () => {
      req.method = 'GET';

      await geminiHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method not allowed'
      });
    });

    test('should handle OPTIONS request for CORS', async () => {
      req.method = 'OPTIONS';

      await geminiHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('File Processing Tests', () => {
    test('should handle PDF file processing', async () => {
      const mockPdfData = 'base64-encoded-pdf-content';
      req.body.files = [{
        name: 'transcript.pdf',
        mimeType: 'application/pdf', 
        data: mockPdfData
      }];

      const mockResponse = {
        response: {
          text: () => JSON.stringify([])
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await geminiHandler(req, res);

      expect(mockModel.generateContent).toHaveBeenCalledWith([
        { text: req.body.prompt },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: mockPdfData
          }
        }
      ]);
    });

    test('should handle multiple PDF files', async () => {
      req.body.files = [
        {
          name: 'transcript1.pdf',
          mimeType: 'application/pdf',
          data: 'pdf-content-1'
        },
        {
          name: 'transcript2.pdf', 
          mimeType: 'application/pdf',
          data: 'pdf-content-2'
        }
      ];

      const mockResponse = {
        response: {
          text: () => JSON.stringify([])
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await geminiHandler(req, res);

      expect(mockModel.generateContent).toHaveBeenCalledWith([
        { text: req.body.prompt },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: 'pdf-content-1'
          }
        },
        {
          inlineData: {
            mimeType: 'application/pdf', 
            data: 'pdf-content-2'
          }
        }
      ]);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle Gemini API errors', async () => {
      const apiError = new Error('Gemini API rate limit exceeded');
      mockModel.generateContent.mockRejectedValue(apiError);

      await geminiHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to generate content',
        message: 'Gemini API rate limit exceeded',
        details: undefined
      });
    });

    test('should handle malformed request body', async () => {
      req.body = {}; // Missing prompt

      await geminiHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required field: prompt'
      });
    });
  });

  describe('Performance Optimization Tests', () => {
    test('should limit max output tokens to 8192', async () => {
      req.body.maxTokens = 16000; // Request more than limit

      const mockResponse = {
        response: {
          text: () => 'response'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await geminiHandler(req, res);

      expect(GoogleGenerativeAI().getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192, // Should be capped at 8192
          topP: 0.95,
          topK: 40
        }
      });
    });

    test('should use appropriate model based on request', async () => {
      req.body.model = 'gemini-1.5-pro';

      const mockResponse = {
        response: {
          text: () => 'response'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await geminiHandler(req, res);

      expect(GoogleGenerativeAI().getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro',
        generationConfig: expect.any(Object)
      });
    });
  });

  describe('CORS Headers Tests', () => {
    test('should set proper CORS headers', async () => {
      const mockResponse = {
        response: {
          text: () => 'response'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await geminiHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });
  });
});