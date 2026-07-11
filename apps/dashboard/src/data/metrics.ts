import { cookies } from 'next/headers';
import type { MetricsSummary } from '@fp/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function getMetrics(): Promise<MetricsSummary> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/metrics`, {
    headers: {
      Cookie: `access_token=${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metrics (${response.status})`);
  }

  return response.json() as Promise<MetricsSummary>;
}
