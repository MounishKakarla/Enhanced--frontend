import { describe, it, expect } from 'vitest';
import { parseApiError } from './errorUtils';

describe('errorUtils', () => {
  it('should extract error message from standard axios response', () => {
    const error = {
      response: {
        data: { message: 'Authentication failed' }
      }
    };
    expect(parseApiError(error)).toBe('Authentication failed');
  });

  it('should fallback to default message if specific message is absent', () => {
    const error = {
      response: { data: {} }
    };
    expect(parseApiError(error, 'Fallback error')).toBe('Fallback error');
  });

  it('should handle native JS errors', () => {
    const error = new Error('Network Error');
    expect(parseApiError(error)).toBe('Network Error');
  });

  it('should handle completely empty errors with default', () => {
    expect(parseApiError(null, 'Unknown error occurred')).toBe('Unknown error occurred');
  });
});
