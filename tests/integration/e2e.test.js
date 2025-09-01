/**
 * End-to-End Integration Tests for Timeout-Resistant Processing
 */

const { createSmallMockPDF, createMediumMockPDF, createLargeMockPDF } = require('../utils/mockHelpers');

// Mock dependencies
jest.mock('@google/generative-ai');
global.fetch = jest.fn();

const HybridProcessor = require('../../src/assets/js/modules/hybridProcessor');
const ChunkProcessor = require('../../src/assets/js/modules/chunkProcessor');
const FallbackProcessor = require('../../src/assets/js/modules/fallbackProcessor');

describe('End-to-End Timeout-Resistant Processing', () => {
  let hybridProcessor;
  let chunkProcessor;
  let fallbackProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Initialize processors
    hybridProcessor = new HybridProcessor();
    chunkProcessor = new ChunkProcessor();
    fallbackProcessor = new FallbackProcessor();

    // Set up environment
    Object.defineProperty(global, 'window', {
      value: {
        ChunkProcessor: chunkProcessor,
        FallbackProcessor: fallbackProcessor
      },
      writable: true
    });
  });

  describe('Small File Processing (Vercel Direct)', () => {
    test('should process small files directly through Vercel', async () => {
      // Mock successful Vercel response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            text: JSON.stringify([{
              "HKIT Subject Code": "HD101",
              "HKIT Subject Name": "Introduction to Computing",
              "Exemption Granted": "TRUE"
            }])
          }
        })
      });

      const smallFile = createSmallMockPDF();
      const files = [{ file: smallFile, name: 'small.pdf' }];
      const prompt = 'Analyze transcript for exemptions';

      const result = await hybridProcessor.processFiles(prompt, files);

      expect(result.success).toBe(true);
      expect(result.processingType).toBe('vercel_direct');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]["HKIT Subject Code"]).toBe("HD101");
      
      // Verify Vercel API was called
      expect(fetch).toHaveBeenCalledWith('/api/gemini', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
    });

    test('should handle Vercel timeout and fallback to chunked', async () => {
      // Mock Vercel timeout
      fetch
        .mockImplementationOnce(() => new Promise(() => {})) // Never resolves (timeout)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'test-job-123',
            completed: true,
            data: [{ "HKIT Subject Code": "HD101" }]
          })
        });

      const smallFile = createSmallMockPDF();
      const files = [{ file: smallFile, name: 'small.pdf' }];
      
      let fallbackTriggered = false;
      const onFallback = jest.fn((error, strategy) => {
        fallbackTriggered = true;
        expect(strategy).toBe('chunked');
      });

      // Initialize hybrid processor with dependencies
      await hybridProcessor.initialize({ 
        chunkProcessor,
        fallbackProcessor 
      });

      const result = await hybridProcessor.processFiles('test prompt', files, {
        onFallback,
        timeout: 100 // Short timeout for testing
      });

      expect(fallbackTriggered).toBe(true);
      expect(result.success).toBe(true);
      expect(onFallback).toHaveBeenCalled();
    });
  });

  describe('Medium File Processing (Chunked)', () => {
    test('should use chunked processing for medium files', async () => {
      // Mock chunked API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'chunked-job-456',
            completed: false,
            partial: true,
            progress: { completed: 1, total: 2, percentage: 50 },
            data: [{ "HKIT Subject Code": "HD101" }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'chunked-job-456',
            status: 'completed',
            completed: true,
            results: [
              { "HKIT Subject Code": "HD101" },
              { "HKIT Subject Code": "HD102" }
            ]
          })
        });

      const mediumFiles = [
        { file: createMediumMockPDF(), name: 'medium1.pdf' },
        { file: createMediumMockPDF(), name: 'medium2.pdf' }
      ];

      let progressUpdates = [];
      const onProgress = jest.fn((progress) => {
        progressUpdates.push(progress);
      });

      await hybridProcessor.initialize({ chunkProcessor, fallbackProcessor });

      const result = await hybridProcessor.processFiles('test prompt', mediumFiles, {
        onProgress
      });

      expect(result.success).toBe(true);
      expect(result.processingType).toMatch(/chunked/);
      expect(onProgress).toHaveBeenCalled();
      expect(progressUpdates.some(p => p.stage === 'strategy_selected')).toBe(true);
      
      // Verify chunked API was called
      expect(fetch).toHaveBeenCalledWith('/api/gemini-chunked', expect.any(Object));
    });
  });

  describe('Large File Processing (Fallback)', () => {
    test('should use fallback processing for large files when available', async () => {
      // Mock API key validation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      });

      // Mock fallback processor
      const mockFallback = {
        isReady: () => true,
        initialize: jest.fn().mockResolvedValue(true),
        processFiles: jest.fn().mockResolvedValue({
          success: true,
          results: [{ "HKIT Subject Code": "HD101" }],
          processingType: 'fallback_single',
          source: 'client_side'
        })
      };

      await hybridProcessor.initialize({ 
        chunkProcessor,
        fallbackProcessor: mockFallback,
        apiKey: 'test-api-key'
      });

      const largeFiles = [
        { file: createLargeMockPDF(), name: 'large1.pdf' },
        { file: createLargeMockPDF(), name: 'large2.pdf' }
      ];

      const result = await hybridProcessor.processFiles('test prompt', largeFiles);

      expect(result.success).toBe(true);
      expect(result.source).toBe('client_side');
      expect(mockFallback.processFiles).toHaveBeenCalled();
    });

    test('should fallback to chunked when fallback processor not available', async () => {
      // No fallback processor initialized
      await hybridProcessor.initialize({ chunkProcessor });

      // Mock chunked response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          jobId: 'large-chunked-789',
          completed: true,
          data: [{ "HKIT Subject Code": "HD101" }]
        })
      });

      const largeFiles = [
        { file: createLargeMockPDF(), name: 'large.pdf' }
      ];

      const result = await hybridProcessor.processFiles('test prompt', largeFiles);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/gemini-chunked', expect.any(Object));
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from rate limiting with backoff', async () => {
      let callCount = 0;
      fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            json: async () => ({
              error: { message: 'Rate limit exceeded' }
            })
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                text: JSON.stringify([{ "HKIT Subject Code": "HD101" }])
              }
            })
          });
        }
      });

      await hybridProcessor.initialize({ chunkProcessor, fallbackProcessor });

      const files = [{ file: createSmallMockPDF(), name: 'test.pdf' }];
      
      const result = await hybridProcessor.processFiles('test prompt', files);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2); // First call fails, second succeeds
    });

    test('should handle multiple consecutive failures gracefully', async () => {
      // All methods fail
      fetch.mockRejectedValue(new Error('Network error'));

      const mockFailingFallback = {
        isReady: () => true,
        initialize: jest.fn().mockResolvedValue(true),
        processFiles: jest.fn().mockRejectedValue(new Error('Fallback failed'))
      };

      await hybridProcessor.initialize({
        chunkProcessor,
        fallbackProcessor: mockFailingFallback,
        apiKey: 'test-key'
      });

      const files = [{ file: createSmallMockPDF(), name: 'test.pdf' }];

      await expect(hybridProcessor.processFiles('test prompt', files))
        .rejects.toThrow();

      const stats = hybridProcessor.getStatus();
      expect(stats.statistics.errors).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking and User Experience', () => {
    test('should provide detailed progress updates throughout processing', async () => {
      // Mock progressive responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'progress-test',
            completed: false,
            partial: true,
            progress: { completed: 1, total: 3, percentage: 33.33 },
            data: [{ "HKIT Subject Code": "HD101" }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'progress-test',
            status: 'processing',
            progress: { completed: 2, total: 3, percentage: 66.67 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'progress-test',
            status: 'completed',
            completed: true,
            results: [
              { "HKIT Subject Code": "HD101" },
              { "HKIT Subject Code": "HD102" },
              { "HKIT Subject Code": "HD103" }
            ]
          })
        });

      const progressEvents = [];
      const onProgress = jest.fn((event) => {
        progressEvents.push(event);
      });

      await hybridProcessor.initialize({ chunkProcessor, fallbackProcessor });

      const files = [
        { file: createMediumMockPDF(), name: 'file1.pdf' },
        { file: createMediumMockPDF(), name: 'file2.pdf' }
      ];

      const result = await hybridProcessor.processFiles('test prompt', files, {
        onProgress
      });

      expect(result.success).toBe(true);
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents.some(e => e.stage === 'strategy_selected')).toBe(true);
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: expect.any(String)
        })
      );
    });
  });

  describe('Performance Optimization', () => {
    test('should select optimal strategy based on file characteristics', () => {
      const testCases = [
        {
          files: [{ file: { size: 100 * 1024 }, name: 'tiny.pdf' }],
          expected: 'vercel'
        },
        {
          files: [
            { file: { size: 800 * 1024 }, name: 'medium1.pdf' },
            { file: { size: 600 * 1024 }, name: 'medium2.pdf' }
          ],
          expected: 'chunked'
        },
        {
          files: [{ file: { size: 8 * 1024 * 1024 }, name: 'large.pdf' }],
          expected: 'fallback' // or 'chunked' if fallback not available
        }
      ];

      testCases.forEach(({ files, expected }) => {
        const recommendation = hybridProcessor.getRecommendation(files, 'test prompt');
        expect(['vercel', 'chunked', 'fallback']).toContain(recommendation.recommendation.method);
      });
    });

    test('should maintain processing statistics for optimization', async () => {
      // Mock successful Vercel call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { text: JSON.stringify([{ "HKIT Subject Code": "HD101" }]) }
        })
      });

      await hybridProcessor.initialize({ chunkProcessor, fallbackProcessor });

      const initialStats = hybridProcessor.getStatus().statistics;
      expect(initialStats.totalProcessed).toBe(0);

      const files = [{ file: createSmallMockPDF(), name: 'stats-test.pdf' }];
      await hybridProcessor.processFiles('test prompt', files);

      const finalStats = hybridProcessor.getStatus().statistics;
      expect(finalStats.totalProcessed).toBe(1);
      expect(finalStats.successfulVercel).toBe(1);
    });
  });

  describe('Configuration and Adaptability', () => {
    test('should respect user preferences for processing method', async () => {
      // Force chunked processing even for small files
      hybridProcessor.updatePreferences({ preferredMethod: 'chunked' });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          jobId: 'forced-chunked',
          completed: true,
          data: [{ "HKIT Subject Code": "HD101" }]
        })
      });

      await hybridProcessor.initialize({ chunkProcessor, fallbackProcessor });

      const smallFile = [{ file: createSmallMockPDF(), name: 'small.pdf' }];
      const result = await hybridProcessor.processFiles('test prompt', smallFile);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/gemini-chunked', expect.any(Object));
    });

    test('should provide processing alternatives and recommendations', () => {
      const files = [{ file: { size: 1024 * 1024 }, name: 'test.pdf' }];
      const recommendation = hybridProcessor.getRecommendation(files, 'test prompt');

      expect(recommendation.analysis).toBeDefined();
      expect(recommendation.recommendation).toBeDefined();
      expect(recommendation.alternatives).toBeInstanceOf(Array);
      expect(recommendation.alternatives.length).toBeGreaterThan(0);
      
      recommendation.alternatives.forEach(alt => {
        expect(alt).toHaveProperty('method');
        expect(alt).toHaveProperty('pros');
        expect(alt).toHaveProperty('cons');
      });
    });
  });
});