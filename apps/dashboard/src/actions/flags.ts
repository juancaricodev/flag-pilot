'use server';

import { cookies } from 'next/headers';
import { updateTag, refresh } from 'next/cache';
import type { Flag } from '@fp/shared';

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

    updateTag('flags');
    refresh();
    return { success: true };
  } catch {
    return { error: 'Failed to toggle flag' };
  }
}

export async function createFlag(data: {
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPct?: number;
}): Promise<{ success: true; flag: Flag } | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return { error: 'Not authenticated' };
    }

    const res = await fetch(`${API_URL}/api/flags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.message ?? 'Failed to create flag' };
    }

    const flag = (await res.json()) as Flag;
    updateTag('flags');
    refresh();
    return { success: true, flag };
  } catch {
    return { error: 'Failed to create flag' };
  }
}

export async function updateFlag(
  id: string,
  data: { name?: string; description?: string; enabled?: boolean; rolloutPct?: number },
): Promise<{ success: true; flag: Flag } | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return { error: 'Not authenticated' };
    }

    const res = await fetch(`${API_URL}/api/flags/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.message ?? 'Failed to update flag' };
    }

    const flag = (await res.json()) as Flag;
    updateTag('flags');
    refresh();
    return { success: true, flag };
  } catch {
    return { error: 'Failed to update flag' };
  }
}

export async function deleteFlag(id: string): Promise<{ success: true } | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return { error: 'Not authenticated' };
    }

    const res = await fetch(`${API_URL}/api/flags/${id}`, {
      method: 'DELETE',
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.message ?? 'Failed to delete flag' };
    }

    updateTag('flags');
    refresh();
    return { success: true };
  } catch {
    return { error: 'Failed to delete flag' };
  }
}
