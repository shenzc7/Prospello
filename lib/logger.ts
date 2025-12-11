type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    }

    if (this.isDevelopment) {
      console.log(`[${entry.timestamp.toISOString()}] ${level.toUpperCase()}: ${message}`, {
        context: entry.context,
        error: error?.stack,
      })
    } else {
      // In production, you might want to send logs to a service like DataDog, LogRocket, etc.
      // For now, we'll just log to console
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error)
  }
}

export const logger = new Logger()
