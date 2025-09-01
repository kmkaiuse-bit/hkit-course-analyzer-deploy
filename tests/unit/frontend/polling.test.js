/**
 * Tests for frontend polling manager
 * @jest-environment jsdom
 */

const PollingManager = require('../../../src/assets/js/modules/pollingManager');

// Mock fetch
global.fetch = jest.fn();

describe('PollingManager', () => {
  let pollingManager;

  beforeEach(() => {
    jest.useFakeTimers();
    pollingManager = new PollingManager();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    pollingManager.stopAll();
  });

  describe('Basic Polling Operations', () => {
    test('should start polling with default strategy', () => {
      const mockCallbacks = {
        onProgress: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      pollingManager.startPolling('test-job-1', mockCallbacks);

      expect(pollingManager.isPolling('test-job-1')).toBe(true);
      expect(pollingManager.getActiveCount()).toBe(1);
    });

    test('should not start duplicate polling for same job', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      pollingManager.startPolling('test-job-1');
      pollingManager.startPolling('test-job-1'); // Duplicate

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already polling job test-job-1')
      );
      expect(pollingManager.getActiveCount()).toBe(1);

      consoleSpy.mockRestore();
    });

    test('should stop polling for specific job', () => {
      pollingManager.startPolling('test-job-1');
      pollingManager.startPolling('test-job-2');

      expect(pollingManager.getActiveCount()).toBe(2);

      pollingManager.stopPolling('test-job-1');

      expect(pollingManager.isPolling('test-job-1')).toBe(false);
      expect(pollingManager.isPolling('test-job-2')).toBe(true);
      expect(pollingManager.getActiveCount()).toBe(1);
    });

    test('should stop all polling operations', () => {
      pollingManager.startPolling('test-job-1');
      pollingManager.startPolling('test-job-2');
      pollingManager.startPolling('test-job-3');

      expect(pollingManager.getActiveCount()).toBe(3);

      pollingManager.stopAll();

      expect(pollingManager.getActiveCount()).toBe(0);
    });
  });

  describe('Polling Execution', () => {
    test('should perform poll after initial interval', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          completed: false,
          progress: { completed: 1, total: 3, percentage: 33.33 },
          results: [{ "HKIT Subject Code": "HD101" }]
        })
      });

      const onProgress = jest.fn();
      pollingManager.startPolling('test-job-1', { onProgress });

      // Fast forward to trigger first poll
      jest.advanceTimersByTime(2000);
      await Promise.resolve(); // Allow promises to resolve

      expect(fetch).toHaveBeenCalledWith('/api/gemini-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: 'test-job-1' })
      });

      expect(onProgress).toHaveBeenCalledWith({
        jobId: 'test-job-1',
        progress: { completed: 1, total: 3, percentage: 33.33 },
        results: [{ "HKIT Subject Code": "HD101" }],
        errors: undefined,
        processingTime: undefined,
        pollCount: 1
      });
    });

    test('should handle job completion', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          completed: true,
          results: [
            { "HKIT Subject Code": "HD101" },
            { "HKIT Subject Code": "HD102" }
          ],
          processingTime: 5000
        })
      });

      const onComplete = jest.fn();
      pollingManager.startPolling('test-job-1', { onComplete });

      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      expect(onComplete).toHaveBeenCalledWith({
        jobId: 'test-job-1',
        results: [
          { "HKIT Subject Code": "HD101" },
          { "HKIT Subject Code": "HD102" }
        ],
        errors: undefined,
        totalTime: expect.any(Number),
        pollCount: 1
      });

      expect(pollingManager.isPolling('test-job-1')).toBe(false);
    });

    test('should handle API errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const onError = jest.fn();
      pollingManager.startPolling('test-job-1', { onError });

      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith({
        jobId: 'test-job-1',
        error: expect.any(Error),
        pollCount: 1,
        totalTime: expect.any(Number)
      });

      expect(pollingManager.isPolling('test-job-1')).toBe(false);
    });
  });

  describe('Exponential Backoff', () => {
    test('should apply exponential backoff between polls', async () => {
      fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            completed: false,
            progress: { completed: 1, total: 3 }
          })
        })
      );

      const onProgress = jest.fn();
      pollingManager.startPolling('test-job-1', { strategy: 'normal', onProgress });

      // First poll at 2000ms
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      expect(fetch).toHaveBeenCalledTimes(1);

      // Second poll should be delayed by backoff (2000 * 1.2 = 2400ms)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      expect(fetch).toHaveBeenCalledTimes(1); // Should not have been called yet

      jest.advanceTimersByTime(400); // Complete the backoff period
      await Promise.resolve();

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should respect maximum interval limits', async () => {
      fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            completed: false,
            progress: { completed: 1, total: 10 }
          })
        })
      );

      pollingManager.startPolling('test-job-1', { strategy: 'normal' });

      const stats = pollingManager.getPollingStats('test-job-1');
      expect(stats.currentInterval).toBe(2000); // Initial interval

      // Simulate multiple polls to trigger max interval
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(stats.currentInterval || 2000);
        await Promise.resolve();
        
        const currentStats = pollingManager.getPollingStats('test-job-1');
        if (currentStats) {
          expect(currentStats.currentInterval).toBeLessThanOrEqual(5000); // Max interval
        }
      }
    });
  });

  describe('Polling Strategies', () => {
    test('should use different intervals for different strategies', () => {
      pollingManager.startPolling('immediate-job', { strategy: 'immediate' });
      pollingManager.startPolling('normal-job', { strategy: 'normal' });
      pollingManager.startPolling('background-job', { strategy: 'background' });

      const immediateStats = pollingManager.getPollingStats('immediate-job');
      const normalStats = pollingManager.getPollingStats('normal-job');
      const backgroundStats = pollingManager.getPollingStats('background-job');

      expect(immediateStats.currentInterval).toBe(1000);
      expect(normalStats.currentInterval).toBe(2000);
      expect(backgroundStats.currentInterval).toBe(5000);
    });

    test('should update strategy dynamically', async () => {
      pollingManager.startPolling('test-job-1', { strategy: 'background' });

      let stats = pollingManager.getPollingStats('test-job-1');
      expect(stats.strategy).toBe('background');
      expect(stats.currentInterval).toBe(5000);

      // Update to immediate strategy
      const updated = pollingManager.updateStrategy('test-job-1', 'immediate');
      expect(updated).toBe(true);

      stats = pollingManager.getPollingStats('test-job-1');
      expect(stats.strategy).toBe('immediate');
      expect(stats.currentInterval).toBe(1000);
    });
  });

  describe('Pause and Resume', () => {
    test('should pause and resume polling', async () => {
      fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true, completed: false })
        })
      );

      pollingManager.startPolling('test-job-1');

      // Pause polling
      const paused = pollingManager.pausePolling('test-job-1');
      expect(paused).toBe(true);

      // Should not poll while paused
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      expect(fetch).not.toHaveBeenCalled();

      // Resume polling
      const resumed = pollingManager.resumePolling('test-job-1');
      expect(resumed).toBe(true);

      // Should resume polling
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide accurate polling statistics', () => {
      pollingManager.startPolling('test-job-1', { strategy: 'normal' });

      const stats = pollingManager.getPollingStats('test-job-1');
      
      expect(stats).toMatchObject({
        jobId: 'test-job-1',
        strategy: 'normal',
        currentInterval: 2000,
        pollCount: 0,
        totalTime: expect.any(Number),
        timeSinceLastUpdate: expect.any(Number),
        isActive: true
      });
    });

    test('should return null for non-existent job stats', () => {
      const stats = pollingManager.getPollingStats('non-existent-job');
      expect(stats).toBeNull();
    });

    test('should provide stats for all active jobs', () => {
      pollingManager.startPolling('job-1');
      pollingManager.startPolling('job-2');
      pollingManager.startPolling('job-3');

      const allStats = pollingManager.getActivePollingStats();
      
      expect(allStats).toHaveLength(3);
      expect(allStats.map(s => s.jobId)).toEqual(['job-1', 'job-2', 'job-3']);
    });
  });

  describe('Global Timeout', () => {
    test('should timeout polling after maximum time', async () => {
      fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true, completed: false })
        })
      );

      const onError = jest.fn();
      pollingManager.startPolling('test-job-1', { 
        onError,
        maxTime: 10000 // 10 seconds
      });

      // Fast forward past max time
      jest.advanceTimersByTime(12000);
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith({
        jobId: 'test-job-1',
        error: expect.objectContaining({
          message: 'Polling timeout exceeded'
        }),
        pollCount: expect.any(Number),
        totalTime: expect.any(Number)
      });

      expect(pollingManager.isPolling('test-job-1')).toBe(false);
    });
  });
});