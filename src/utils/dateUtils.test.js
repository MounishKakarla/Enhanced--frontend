import { describe, it, expect } from 'vitest';
import { formatDate } from './dateUtils';

describe('dateUtils', () => {
  it('formats valid ISO strings correctly', () => {
    // en-IN locale formats as 15 Oct 2023
    const result = formatDate('2023-10-15T14:30:00Z');
    expect(result).toContain('Oct 2023'); // Safe partial match
  });

  it('handles null or undefined gracefully', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('handles invalid date strings gracefully', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date'); // returns original string on failure
  });
});
