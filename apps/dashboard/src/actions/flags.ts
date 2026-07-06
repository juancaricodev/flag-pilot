'use server';

import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function toggleFlag(
  flagId: string,
  enabled: boolean,
): Promise<{ success: true } | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return { error: 'Not authenticated' };
    }

    const res = await fetch(`${API_URL}/api/flags/${flagId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${token}`,
      },
      body: JSON.stringify({ enabled }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.message ?? 'Failed to toggle flag' };
    }

    revalidateTag('flags');
    return { success: true };
  } catch {
    return { error: 'Failed to toggle flag' };
  }
}
