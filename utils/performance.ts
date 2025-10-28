/**
 * Lightweight performance monitoring utility for development builds
 * Provides timing, memory usage, and performance metrics
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;
  private startTimes: Map<string, number> = new Map();

  constructor() {
    // Only enable in development builds
    this.isEnabled = (global as any).__DEV__ ?? false;

    if (this.isEnabled) {
      console.log('🚀 Performance monitoring enabled');
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(operationName: string): void {
    if (!this.isEnabled) return;

    this.startTimes.set(operationName, performance.now());
  }

  /**
   * End timing an operation and record the metric
   */
  endTimer(
    operationName: string,
    metadata?: Record<string, unknown>
  ): number | null {
    if (!this.isEnabled) return null;

    const startTime = this.startTimes.get(operationName);
    if (!startTime) {
      console.warn(
        `Performance: No start time found for operation: ${operationName}`
      );
      return null;
    }

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name: operationName,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.startTimes.delete(operationName);

    // Log slow operations (>100ms) in development
    if (duration > 100) {
      console.warn(
        `🐌 Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`,
        metadata
      );
    }

    return duration;
  }

  /**
   * Time an async operation
   */
  async timeAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.isEnabled) {
      return operation();
    }

    this.startTimer(operationName);
    try {
      const result = await operation();
      this.endTimer(operationName, metadata);
      return result;
    } catch (error) {
      this.endTimer(operationName, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Time a synchronous operation
   */
  timeSync<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    if (!this.isEnabled) {
      return operation();
    }

    this.startTimer(operationName);
    try {
      const result = operation();
      this.endTimer(operationName, metadata);
      return result;
    } catch (error) {
      this.endTimer(operationName, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): Record<string, number> | null {
    if (!this.isEnabled || !(global.performance as any)?.memory) {
      return null;
    }

    const memory = (global.performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  /**
   * Generate a performance report
   */
  getReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        metrics: [],
        summary: {
          totalOperations: 0,
          averageDuration: 0,
          slowestOperation: null,
          fastestOperation: null,
        },
      };
    }

    const sortedMetrics = [...this.metrics].sort(
      (a, b) => a.duration - b.duration
    );
    const totalDuration = this.metrics.reduce(
      (sum, metric) => sum + metric.duration,
      0
    );

    return {
      metrics: this.metrics,
      summary: {
        totalOperations: this.metrics.length,
        averageDuration: totalDuration / this.metrics.length,
        slowestOperation: sortedMetrics[sortedMetrics.length - 1],
        fastestOperation: sortedMetrics[0],
      },
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!this.isEnabled) return;

    const report = this.getReport();
    if (report.summary.totalOperations === 0) {
      console.log('📊 No performance metrics recorded');
      return;
    }

    console.group('📊 Performance Summary');
    console.log(`Total Operations: ${report.summary.totalOperations}`);
    console.log(
      `Average Duration: ${report.summary.averageDuration.toFixed(2)}ms`
    );

    if (report.summary.slowestOperation) {
      console.log(
        `Slowest: ${report.summary.slowestOperation.name} (${report.summary.slowestOperation.duration.toFixed(2)}ms)`
      );
    }

    if (report.summary.fastestOperation) {
      console.log(
        `Fastest: ${report.summary.fastestOperation.name} (${report.summary.fastestOperation.duration.toFixed(2)}ms)`
      );
    }

    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage) {
      console.log('Memory Usage:', memoryUsage);
    }

    console.groupEnd();
  }
}

// Export the class for testing
export { PerformanceMonitor };

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (operationName: string): void =>
  performanceMonitor.startTimer(operationName);
export const endTimer = (
  operationName: string,
  metadata?: Record<string, unknown>
): number | null => performanceMonitor.endTimer(operationName, metadata);
export const timeAsync = <T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> =>
  performanceMonitor.timeAsync(operationName, operation, metadata);
export const timeSync = <T>(
  operationName: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): T => performanceMonitor.timeSync(operationName, operation, metadata);
export const getPerformanceReport = (): PerformanceReport =>
  performanceMonitor.getReport();
export const logPerformanceSummary = (): void =>
  performanceMonitor.logSummary();
