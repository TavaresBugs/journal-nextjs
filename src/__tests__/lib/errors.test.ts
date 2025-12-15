import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode, getErrorMessage, toAppError } from '@/lib/errors';

describe('AppError', () => {
  it('should create an AppError with message and code', () => {
    const error = new AppError('Test error', ErrorCode.VALIDATION_ERROR, 400);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('AppError');
  });

  it('should create an AppError with default statusCode', () => {
    const error = new AppError('Test error');
    expect(error.statusCode).toBe(500);
  });

  it('should create an AppError with default code', () => {
    const error = new AppError('Test error');
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.statusCode).toBe(500);
  });
});

describe('getErrorMessage', () => {
  it('should return message from AppError', () => {
    const error = new AppError('App error message');
    expect(getErrorMessage(error)).toBe('App error message');
  });

  it('should return message from Error', () => {
    const error = new Error('Standard error message');
    expect(getErrorMessage(error)).toBe('Standard error message');
  });

  it('should return string error itself', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should return message property from object', () => {
    expect(getErrorMessage({ message: 'Object message' })).toBe('Object message');
  });

  it('should return default message for unknown types', () => {
    expect(getErrorMessage(123)).toBe('An unexpected error occurred');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });
});

describe('toAppError', () => {
  it('should return the same AppError if input is AppError', () => {
    const originalError = new AppError('Original', ErrorCode.DB_NOT_FOUND, 404);
    const result = toAppError(originalError);
    expect(result).toBe(originalError);
  });

  it('should convert Error to AppError', () => {
    const error = new Error('Standard error');
    const result = toAppError(error);
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Standard error');
    expect(result.statusCode).toBe(500);
  });

  it('should convert string to AppError', () => {
    const result = toAppError('String error');
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('String error');
    expect(result.statusCode).toBe(500);
  });

  it('should return default message for unknown types', () => {
    const result = toAppError(123, 'Custom default');
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Custom default');
    expect(result.statusCode).toBe(500);
  });
});
