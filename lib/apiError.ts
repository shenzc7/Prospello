import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from './logger'

export type APIResponse<T = unknown> = {
  ok: boolean
  data?: T
  error?: {
    code: string
    msg: string
    details?: unknown
  }
}

export type APIErrorType = 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_ERROR' | 'RATE_LIMIT_EXCEEDED'

export class APIError extends Error {
  public readonly code: APIErrorType
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(code: APIErrorType, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details

    // Map error codes to HTTP status codes
    this.statusCode = {
      VALIDATION_ERROR: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      INTERNAL_ERROR: 500,
      RATE_LIMIT_EXCEEDED: 429,
    }[code]
  }
}

export function createErrorResponse(
  error: APIError | ZodError | Error | string | unknown,
  context?: Record<string, unknown>
): NextResponse<APIResponse> {
  let apiError: APIError

  if (error instanceof APIError) {
    apiError = error
  } else if (error instanceof ZodError) {
    apiError = new APIError(
      'VALIDATION_ERROR',
      'Validation failed',
      error.errors
    )
  } else if (error instanceof Error) {
    apiError = new APIError(
      'INTERNAL_ERROR',
      error.message || 'Internal server error'
    )
  } else if (typeof error === 'string') {
    apiError = new APIError(
      'INTERNAL_ERROR',
      error
    )
  } else {
    apiError = new APIError(
      'INTERNAL_ERROR',
      'Internal server error'
    )
  }

  // Log the error with context
  logger.error(`API Error: ${apiError.code}`, apiError, {
    ...context,
    statusCode: apiError.statusCode,
    message: apiError.message,
  })

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: apiError.code,
        msg: apiError.message,
        details: apiError.details,
      },
    },
    { status: apiError.statusCode }
  )
}

export function createSuccessResponse<T>(data: T, statusCode: number = 200): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status: statusCode }
  )
}

// Convenience functions for common errors
export const errors = {
  unauthorized: (message = 'Unauthorized') =>
    new APIError('UNAUTHORIZED', message),

  forbidden: (message = 'Forbidden') =>
    new APIError('FORBIDDEN', message),

  notFound: (resource = 'Resource', message?: string) =>
    new APIError('NOT_FOUND', message || `${resource} not found`),

  validation: (message = 'Validation failed', details?: unknown) =>
    new APIError('VALIDATION_ERROR', message, details),

  internal: (message = 'Internal server error', details?: unknown) =>
    new APIError('INTERNAL_ERROR', message, details),
}
