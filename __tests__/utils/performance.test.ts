import {
  performanceMonitor,
  startTimer,
  endTimer,
  timeAsync,
  timeSync,
  getPerformanceReport,
  logPerformanceSummary,
  PerformanceMetric,
  PerformanceReport,
} from '../../utils/performance';

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleGroup = jest.fn();
const mockConsoleGroupEnd = jest.fn();

// Mock performance API
const mockPerformance = {
  now: jest.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

// Mock __DEV__ global
const originalDev = (global as any).__DEV__;

describe('performance', () => {
  let performanceMonitorInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    global.console.log = mockConsoleLog;
    global.console.warn = mockConsoleWarn;
    global.console.group = mockConsoleGroup;
    global.console.groupEnd = mockConsoleGroupEnd;

    // Mock performance API with sequential values
    let timeCounter = 1000;
    mockPerformance.now.mockImplementation(() => {
      timeCounter += 1;
      return timeCounter;
    });
    global.performance = mockPerformance as any;

    // Mock __DEV__ as true for testing
    (global as any).__DEV__ = true;

    // Create a fresh instance for each test
    const { PerformanceMonitor } = require('../../utils/performance');
    performanceMonitorInstance = new PerformanceMonitor();
  });

  afterEach(() => {
    // Restore original __DEV__ value
    (global as any).__DEV__ = originalDev;
  });

  describe('PerformanceMonitor class', () => {
    it('should be enabled in development mode', () => {
      expect(performanceMonitorInstance).toBeDefined();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🚀 Performance monitoring enabled'
      );
    });

    it('should be disabled in production mode', () => {
      (global as any).__DEV__ = false;

      // Create a new instance to test production behavior
      const { PerformanceMonitor } = require('../../utils/performance');
      const productionMonitor = new PerformanceMonitor();

      productionMonitor.startTimer('test-operation');
      const duration = productionMonitor.endTimer('test-operation');

      expect(duration).toBeNull();
    });
  });

  describe('startTimer and endTimer', () => {
    it('should start and end timer correctly', () => {
      performanceMonitorInstance.startTimer('test-operation');
      const duration = performanceMonitorInstance.endTimer('test-operation');

      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });

    it('should return null when ending non-existent timer', () => {
      const duration = performanceMonitorInstance.endTimer(
        'non-existent-operation'
      );

      expect(duration).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Performance: No start time found for operation: non-existent-operation'
      );
    });

    it('should record metrics correctly', () => {
      performanceMonitorInstance.startTimer('test-operation');
      performanceMonitorInstance.endTimer('test-operation', {
        category: 'test',
      });

      const report = performanceMonitorInstance.getReport();
      expect(report.metrics).toHaveLength(1);

      const metric = report.metrics[0];
      expect(metric.name).toBe('test-operation');
      expect(metric.metadata).toEqual({ category: 'test' });
      expect(metric.timestamp).toBeDefined();
    });

    it('should warn about slow operations', () => {
      // Mock a slow operation
      mockPerformance.now
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1200); // end time (200ms)

      performanceMonitorInstance.startTimer('slow-operation');
      performanceMonitorInstance.endTimer('slow-operation');

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '🐌 Slow operation detected: slow-operation took 200.00ms',
        undefined
      );
    });
  });

  describe('timeAsync', () => {
    it('should time async operations correctly', async () => {
      const asyncOperation = jest.fn().mockResolvedValue('result');

      const result = await performanceMonitorInstance.timeAsync(
        'async-test',
        asyncOperation
      );

      expect(result).toBe('result');
      expect(asyncOperation).toHaveBeenCalledTimes(1);

      const report = performanceMonitorInstance.getReport();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('async-test');
    });

    it('should handle async operation errors', async () => {
      const asyncOperation = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));

      await expect(
        performanceMonitorInstance.timeAsync('async-error', asyncOperation)
      ).rejects.toThrow('Test error');

      const report = performanceMonitorInstance.getReport();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].metadata?.error).toBe(true);
    });

    it('should pass through operation result without timing in production', async () => {
      (global as any).__DEV__ = false;

      const { PerformanceMonitor } = require('../../utils/performance');
      const productionMonitor = new PerformanceMonitor();

      const asyncOperation = jest.fn().mockResolvedValue('result');
      const result = await productionMonitor.timeAsync(
        'async-test',
        asyncOperation
      );

      expect(result).toBe('result');
      expect(asyncOperation).toHaveBeenCalledTimes(1);

      const report = productionMonitor.getReport();
      expect(report.metrics).toHaveLength(0);
    });
  });

  describe('timeSync', () => {
    it('should time synchronous operations correctly', () => {
      const syncOperation = jest.fn().mockReturnValue('result');

      const result = performanceMonitorInstance.timeSync(
        'sync-test',
        syncOperation
      );

      expect(result).toBe('result');
      expect(syncOperation).toHaveBeenCalledTimes(1);

      const report = performanceMonitorInstance.getReport();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('sync-test');
    });

    it('should handle synchronous operation errors', () => {
      const syncOperation = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() =>
        performanceMonitorInstance.timeSync('sync-error', syncOperation)
      ).toThrow('Test error');

      const report = performanceMonitorInstance.getReport();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].metadata?.error).toBe(true);
    });

    it('should pass through operation result without timing in production', () => {
      (global as any).__DEV__ = false;

      const { PerformanceMonitor } = require('../../utils/performance');
      const productionMonitor = new PerformanceMonitor();

      const syncOperation = jest.fn().mockReturnValue('result');
      const result = productionMonitor.timeSync('sync-test', syncOperation);

      expect(result).toBe('result');
      expect(syncOperation).toHaveBeenCalledTimes(1);

      const report = productionMonitor.getReport();
      expect(report.metrics).toHaveLength(0);
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage when available', () => {
      const memoryUsage = performanceMonitorInstance.getMemoryUsage();

      expect(memoryUsage).toEqual({
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      });
    });

    it('should return null when performance.memory is not available', () => {
      delete (global.performance as any).memory;

      const memoryUsage = performanceMonitorInstance.getMemoryUsage();
      expect(memoryUsage).toBeNull();
    });
  });

  describe('getPerformanceReport', () => {
    it('should return empty report when no metrics exist', () => {
      const report = getPerformanceReport();

      expect(report.metrics).toHaveLength(0);
      expect(report.summary.totalOperations).toBe(0);
      expect(report.summary.averageDuration).toBe(0);
      expect(report.summary.slowestOperation).toBeNull();
      expect(report.summary.fastestOperation).toBeNull();
    });

    it('should return correct summary for multiple metrics', () => {
      // Add some test metrics
      performanceMonitorInstance.startTimer('fast-operation');
      performanceMonitorInstance.endTimer('fast-operation');

      performanceMonitorInstance.startTimer('slow-operation');
      performanceMonitorInstance.endTimer('slow-operation');

      const report = performanceMonitorInstance.getReport();

      expect(report.metrics).toHaveLength(2);
      expect(report.summary.totalOperations).toBe(2);
      expect(report.summary.averageDuration).toBeGreaterThan(0);
      expect(report.summary.slowestOperation).toBeDefined();
      expect(report.summary.fastestOperation).toBeDefined();
    });

    it('should calculate correct averages and extremes', () => {
      // Mock specific durations
      mockPerformance.now
        .mockReturnValueOnce(1000) // start fast
        .mockReturnValueOnce(1050) // end fast (50ms)
        .mockReturnValueOnce(1100) // start slow
        .mockReturnValueOnce(1300); // end slow (200ms)

      performanceMonitorInstance.startTimer('fast-operation');
      performanceMonitorInstance.endTimer('fast-operation');

      performanceMonitorInstance.startTimer('slow-operation');
      performanceMonitorInstance.endTimer('slow-operation');

      const report = performanceMonitorInstance.getReport();

      expect(report.summary.averageDuration).toBe(125); // (50 + 200) / 2
      expect(report.summary.fastestOperation?.name).toBe('fast-operation');
      expect(report.summary.slowestOperation?.name).toBe('slow-operation');
    });
  });

  describe('clear', () => {
    it('should clear all metrics and timers', () => {
      performanceMonitorInstance.startTimer('test-operation');
      performanceMonitorInstance.endTimer('test-operation');

      expect(performanceMonitorInstance.getReport().metrics).toHaveLength(1);

      performanceMonitorInstance.clear();

      expect(performanceMonitorInstance.getReport().metrics).toHaveLength(0);
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics as JSON string', () => {
      performanceMonitorInstance.startTimer('test-operation');
      performanceMonitorInstance.endTimer('test-operation');

      const exported = performanceMonitorInstance.exportMetrics();
      const parsed = JSON.parse(exported);

      expect(parsed.metrics).toHaveLength(1);
      expect(parsed.summary.totalOperations).toBe(1);
    });
  });

  describe('logPerformanceSummary', () => {
    it('should log summary when metrics exist', () => {
      performanceMonitorInstance.startTimer('test-operation');
      performanceMonitorInstance.endTimer('test-operation');

      performanceMonitorInstance.logSummary();

      expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Performance Summary');
      expect(mockConsoleGroupEnd).toHaveBeenCalled();
    });

    it('should log appropriate message when no metrics exist', () => {
      performanceMonitorInstance.logSummary();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 No performance metrics recorded'
      );
    });

    it('should not log in production mode', () => {
      (global as any).__DEV__ = false;

      const { PerformanceMonitor } = require('../../utils/performance');
      const productionMonitor = new PerformanceMonitor();

      productionMonitor.startTimer('test-operation');
      productionMonitor.endTimer('test-operation');

      productionMonitor.logSummary();

      expect(mockConsoleGroup).not.toHaveBeenCalled();
    });
  });

  describe('convenience functions', () => {
    it('should provide working convenience functions', () => {
      performanceMonitorInstance.startTimer('convenience-test');
      const duration = performanceMonitorInstance.endTimer('convenience-test');

      expect(duration).toBeGreaterThan(0);

      const report = performanceMonitorInstance.getReport();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('convenience-test');
    });
  });
});
