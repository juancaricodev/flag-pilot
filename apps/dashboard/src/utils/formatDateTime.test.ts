import { formatDateTime } from './formatDateTime';

describe('formatDateTime', () => {
  it('formats an ISO string to "Mmm d, YYYY, h:mm AM/PM" format', () => {
    const result = formatDateTime('2026-06-25T10:00:00Z');
    expect(result).toBe('Jun 25, 2026, 10:00 AM');
  });

  it('formats midnight correctly', () => {
    const result = formatDateTime('2026-06-25T00:00:00Z');
    expect(result).toBe('Jun 25, 2026, 12:00 AM');
  });

  it('formats afternoon time correctly', () => {
    const result = formatDateTime('2026-06-25T15:30:00Z');
    expect(result).toBe('Jun 25, 2026, 3:30 PM');
  });
});
