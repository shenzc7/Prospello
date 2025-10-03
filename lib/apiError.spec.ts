import { describe, it, expect } from '@jest/globals';
import { APIError, createErrorResponse, errors } from './apiError';
import { ZodError, ZodIssueCode } from 'zod';

describe('APIError and createErrorResponse', () => {
  it('should correctly map APIError to a NextResponse', async () => {
    const error = errors.notFound('User');
    const response = createErrorResponse(error);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.msg).toBe('User not found');
  });

  it('should correctly map ZodError to a NextResponse', async () => {
    const zodError = new ZodError([
      {
        code: ZodIssueCode.invalid_type,
        path: ['name'],
        message: 'Name must be a string',
        expected: 'string',
        received: 'number',
      },
    ]);
    const response = createErrorResponse(zodError);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.msg).toBe('Validation failed');
    expect(json.error.details).toBeInstanceOf(Array);
    expect(json.error.details[0].path[0]).toBe('name');
  });

  it('should correctly map a generic Error to a NextResponse', async () => {
    const error = new Error('Something went wrong');
    const response = createErrorResponse(error);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
    expect(json.error.msg).toBe('Something went wrong');
  });

  it('should handle unknown errors', async () => {
    const response = createErrorResponse({});
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });

  it('should create specific errors using the errors object', () => {
    const unauthorized = errors.unauthorized();
    expect(unauthorized).toBeInstanceOf(APIError);
    expect(unauthorized.code).toBe('UNAUTHORIZED');
    expect(unauthorized.statusCode).toBe(401);

    const forbidden = errors.forbidden('Admin only');
    expect(forbidden.message).toBe('Admin only');
    expect(forbidden.statusCode).toBe(403);
  });
});
