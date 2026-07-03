'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type LoginResult = { success: true } | { success: false; error: string };

export async function login(
  _prevState: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body.message ?? `Login failed (${response.status})`;
      return { success: false, error: message };
    }

    const data = await response.json();
    const { accessToken } = data as { accessToken: string };

    const cookieStore = await cookies();
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days (seconds)
      path: '/',
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('access_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });

  redirect('/login');
}
