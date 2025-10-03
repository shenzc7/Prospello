import { logger } from './logger'

export class PerformanceMonitor {
  private startTime: number
  private operation: string

  constructor(operation: string) {
    this.operation = operation
    this.startTime = performance.now()
  }

  end(context?: Record<string, any>) {
    const duration = performance.now() - this.startTime
    logger.info(`Performance: ${this.operation} completed`, {
      ...context,
      duration: `${Math.round(duration * 100) / 100}ms`,
      operation: this.operation,
    })

    // Warn if operation takes longer than 1 second
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${this.operation}`, {
        duration: `${Math.round(duration)}ms`,
        operation: this.operation,
      })
    }
  }
}

export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const monitor = new PerformanceMonitor(operationName)

    try {
      const result = await fn(...args)
      monitor.end({ success: true })
      return result
    } catch (error) {
      monitor.end({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }
}

// Database query performance monitoring
export function monitorDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string,
  tableName?: string
): Promise<T> {
  const monitor = new PerformanceMonitor(`DB Query: ${queryName}`)

  return queryFn()
    .then((result) => {
      monitor.end({
        success: true,
        queryType: queryName,
        tableName,
      })
      return result
    })
    .catch((error) => {
      monitor.end({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        queryType: queryName,
        tableName,
      })
      throw error
    })
}
