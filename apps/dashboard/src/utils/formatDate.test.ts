import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats a standard ISO date string', () => {
    const result = formatDate('2026-06-15T12:00:00Z');
    expect(result).toBe('Jun 15, 2026');
  });

  it('formats a date at the beginning of the year', () => {
    const result = formatDate('2026-01-01T00:00:00Z');
    expect(result).toBe('Jan 1, 2026');
  });

  it('formats a date at the end of the year', () => {
    const result = formatDate('2026-12-31T23:59:59Z');
    expect(result).toBe('Dec 31, 2026');
  });

  it('handles single-digit day', () => {
    const result = formatDate('2026-03-05T00:00:00Z');
    expect(result).toBe('Mar 5, 2026');
  });

  it('handles dates in different years', () => {
    const result = formatDate('2025-07-04T00:00:00Z');
    expect(result).toBe('Jul 4, 2025');
  });
});
