/**
 * Format an ISO date string to a human-readable format (UTC).
 * Example: "2026-06-15T12:00:00Z" → "Jun 15, 2026"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
