import { cookies } from 'next/headers';
import type { Flag } from '@fp/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function getFlags(): Promise<Flag[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/flags`, {
    headers: {
      Cookie: `access_token=${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch flags (${response.status})`);
  }

  return response.json() as Promise<Flag[]>;
}
