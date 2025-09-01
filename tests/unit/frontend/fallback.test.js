/**
 * Tests for fallback processor (client-side processing)
 * @jest-environment jsdom
 */

const FallbackProcessor = require('../../../src/assets/js/modules/fallbackProcessor');
const { createMockPDFFile, createLargeMockPDF } = require('../../utils/mockHelpers');

// Mock fetch globally
global.fetch = jest.fn();

describe('FallbackProcessor', () => {
  let fallbackProcessor;
  const mockAPIKey = 'test-api-key-123456789';

  beforeEach(() => {
    fallbackProcessor = new FallbackProcessor();
    fetch.mockClear();
    localStorage.clear();
  });

  describe('Availability Checks', () => {
    test('should detect available browser APIs', () => {
      const status = fallbackProcessor.getStatus();
      expect(status.available).toBe(true);
    });

    test('should report correct initialization status', () => {
      let status = fallbackProcessor.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.ready).toBe(false);

      fallbackProcessor.apiKey = mockAPIKey;
      
      status = fallbackProcessor.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.ready).toBe(true);
    });
  });

  describe('API Key Management', () => {
    test('should validate API key during initialization', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      });

      const result = await fallbackProcessor.initialize(mockAPIKey);
      expect(result).toBe(true);
      expect(fallbackProcessor.apiKey).toBe(mockAPIKey);
    });

    test('should reject invalid API key', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid API key' }
        })
      });

      await expect(fallbackProcessor.initialize('invalid-key'))
        .rejects.toThrow('Invalid API key');
    });

    test('should require non-empty API key', async () => {
      await expect(fallbackProcessor.initialize(''))
        .rejects.toThrow('API key is required');
        
      await expect(fallbackProcessor.initialize('   '))
        .rejects.toThrow('API key is required');
    });

    test('should store and retrieve API key from localStorage', () => {
      fallbackProcessor.storeAPIKey(mockAPIKey, true);
      
      const stored = fallbackProcessor.getStoredAPIKey();
      expect(stored).toBe(mockAPIKey);
    });

    test('should clear stored API key', () => {
      localStorage.setItem('gemini_api_key', mockAPIKey);
      
      fallbackProcessor.clearStoredAPIKey();
      
      expect(localStorage.getItem('gemini_api_key')).toBeNull();
      expect(fallbackProcessor.apiKey).toBeNull();
    });
  });

  describe('File Preparation', () => {
    test('should prepare PDF files for API processing', async () => {
      const mockFile = createMockPDFFile('test.pdf', 1024);
      const fileObj = { file: mockFile, name: 'test.pdf' };

      // Mock FileReader
      global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(function() {
          this.onload({ target: { result: 'data:application/pdf;base64,dGVzdCBjb250ZW50' } });
        }),
        result: 'data:application/pdf;base64,dGVzdCBjb250ZW50'
      }));

      const prepared = await fallbackProcessor.prepareFiles([fileObj]);
      
      expect(prepared).toHaveLength(1);
      expect(prepared[0]).toMatchObject({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        data: expect.any(String),
        size: 1024
      });
    });

    test('should reject files that are too large', async () => {
      const largeFile = createMockPDFFile('large.pdf', 25 * 1024 * 1024); // 25MB
      const fileObj = { file: largeFile, name: 'large.pdf' };

      await expect(fallbackProcessor.prepareFiles([fileObj]))
        .rejects.toThrow('File too large: large.pdf');
    });

    test('should handle file read errors', async () => {
      const mockFile = createMockPDFFile('error.pdf', 1024);
      const fileObj = { file: mockFile, name: 'error.pdf' };

      // Mock FileReader to simulate error
      global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(function() {
          this.onerror();
        })
      }));

      await expect(fallbackProcessor.prepareFiles([fileObj]))
        .rejects.toThrow('File preparation failed: error.pdf');
    });
  });

  describe('Processing Strategy', () => {
    beforeEach(() => {
      fallbackProcessor.apiKey = mockAPIKey;
    });

    test('should choose single processing for small files', () => {
      const files = [
        { size: 500 * 1024, name: 'small1.pdf' }, // 500KB
        { size: 300 * 1024, name: 'small2.pdf' }  // 300KB
      ];
      const prompt = 'Short prompt';

      const strategy = fallbackProcessor.determineStrategy(files, prompt);
      expect(strategy.type).toBe('single');
    });

    test('should choose chunked processing for large files', () => {
      const files = [
        { size: 3 * 1024 * 1024, name: 'large1.pdf' }, // 3MB
        { size: 2 * 1024 * 1024, name: 'large2.pdf' }, // 2MB
        { size: 1 * 1024 * 1024, name: 'large3.pdf' }  // 1MB
      ];
      const prompt = 'Processing prompt';

      const strategy = fallbackProcessor.determineStrategy(files, prompt);
      expect(strategy.type).toBe('chunked');
    });
  });

  describe('Single File Processing', () => {
    beforeEach(() => {
      fallbackProcessor.apiKey = mockAPIKey;
    });

    test('should process single API call successfully', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify([{
                "HKIT Subject Code": "HD101",
                "HKIT Subject Name": "Test Course",
                "Exemption Granted": "TRUE"
              }])
            }]
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const files = [{ name: 'test.pdf', mimeType: 'application/pdf', data: 'base64data', size: 1024 }];
      const results = await fallbackProcessor.processSingle('test prompt', files, 'gemini-1.5-flash', 10000);

      expect(results).toEqual([{
        "HKIT Subject Code": "HD101",
        "HKIT Subject Name": "Test Course", 
        "Exemption Granted": "TRUE"
      }]);
    });

    test('should handle API errors in single processing', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Rate limit exceeded' }
        })
      });

      const files = [{ name: 'test.pdf', mimeType: 'application/pdf', data: 'base64data', size: 1024 }];
      
      await expect(fallbackProcessor.processSingle('test prompt', files, 'gemini-1.5-flash', 10000))
        .rejects.toThrow('API Error: Rate limit exceeded');
    });

    test('should handle timeout in single processing', async () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const files = [{ name: 'test.pdf', mimeType: 'application/pdf', data: 'base64data', size: 1024 }];
      
      await expect(fallbackProcessor.processSingle('test prompt', files, 'gemini-1.5-flash', 100))
        .rejects.toThrow('Request timeout');
    });
  });

  describe('Chunked Processing', () => {
    beforeEach(() => {
      fallbackProcessor.apiKey = mockAPIKey;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should process files in chunks', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify([{
                "HKIT Subject Code": "HD101",
                "HKIT Subject Name": "Test Course"
              }])
            }]
          }
        }]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const files = [
        { name: 'file1.pdf', size: 1024 },
        { name: 'file2.pdf', size: 1024 },
        { name: 'file3.pdf', size: 1024 }
      ];

      const onProgress = jest.fn();
      
      const resultPromise = fallbackProcessor.processChunked(
        'test prompt', 
        files, 
        {
          chunkSize: 2,
          model: 'gemini-1.5-flash',
          timeout: 10000,
          onProgress
        }
      );

      // Fast forward timers to handle delays between chunks
      jest.advanceTimersByTime(2000);
      
      const results = await resultPromise;

      expect(fetch).toHaveBeenCalledTimes(2); // 2 chunks
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'processing',
          message: expect.stringContaining('chunk')
        })
      );
    });

    test('should handle chunk failures gracefully', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: JSON.stringify([{ "HKIT Subject Code": "HD101" }]) }]
              }
            }]
          })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const files = [
        { name: 'file1.pdf', size: 1024 },
        { name: 'file2.pdf', size: 1024 }
      ];

      const results = await fallbackProcessor.processChunked(
        'test prompt',
        files,
        { chunkSize: 1, model: 'gemini-1.5-flash', timeout: 10000 }
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ "HKIT Subject Code": "HD101" });
      expect(results[1]).toMatchObject({
        error: expect.stringContaining('Chunk 2 failed')
      });
    });
  });

  describe('Full Processing Workflow', () => {
    test('should require initialization before processing', async () => {
      const files = [createMockPDFFile('test.pdf', 1024)];
      
      await expect(fallbackProcessor.processFiles('prompt', [{ file: files[0] }]))
        .rejects.toThrow('Fallback processor not initialized');
    });

    test('should complete full processing workflow', async () => {
      // Initialize
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      });

      await fallbackProcessor.initialize(mockAPIKey);

      // Mock file processing
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify([{
                "HKIT Subject Code": "HD101",
                "HKIT Subject Name": "Test Course"
              }])
            }]
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Mock FileReader for file preparation
      global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(function() {
          this.onload({ target: { result: 'data:application/pdf;base64,dGVzdA==' } });
        })
      }));

      const mockFile = createMockPDFFile('test.pdf', 1024);
      const onProgress = jest.fn();

      const result = await fallbackProcessor.processFiles(
        'test prompt',
        [{ file: mockFile, name: 'test.pdf' }],
        { onProgress }
      );

      expect(result).toMatchObject({
        success: true,
        results: [{
          "HKIT Subject Code": "HD101",
          "HKIT Subject Name": "Test Course"
        }],
        processingType: 'fallback_single',
        source: 'client_side'
      });

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'completed' })
      );
    });
  });

  describe('Response Parsing', () => {
    test('should parse valid Gemini response', () => {
      const response = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify([{ "HKIT Subject Code": "HD101" }])
            }]
          }
        }]
      };

      const parsed = fallbackProcessor.parseGeminiResponse(response);
      expect(parsed).toEqual([{ "HKIT Subject Code": "HD101" }]);
    });

    test('should handle malformed JSON in response', () => {
      const response = {
        candidates: [{
          content: {
            parts: [{ text: 'Not valid JSON' }]
          }
        }]
      };

      expect(() => fallbackProcessor.parseGeminiResponse(response))
        .toThrow('Failed to parse AI response');
    });

    test('should handle empty response', () => {
      const response = { candidates: [] };

      expect(() => fallbackProcessor.parseGeminiResponse(response))
        .toThrow('No candidates in response');
    });
  });

  describe('File Chunking', () => {
    test('should chunk files correctly', () => {
      const files = [
        { name: 'file1.pdf' },
        { name: 'file2.pdf' },
        { name: 'file3.pdf' },
        { name: 'file4.pdf' },
        { name: 'file5.pdf' }
      ];

      const chunks = fallbackProcessor.chunkFiles(files, 2);
      
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveLength(2);
      expect(chunks[1]).toHaveLength(2);
      expect(chunks[2]).toHaveLength(1);
      expect(chunks[2][0].name).toBe('file5.pdf');
    });
  });
});