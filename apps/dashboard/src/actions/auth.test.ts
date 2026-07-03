/**
 * @jest-environment node
 */

import { login, logout } from './auth';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCookieSet = jest.fn();
const mockRedirect = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: mockCookieSet,
  })),
}));

jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // Simulate Next.js redirect behaviour — throws a special value
    throw new Error(`REDIRECT: ${url}`);
  },
}));

const originalFetch = globalThis.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = jest.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ── Helpers ────────────────────────────────────────────────────────────────

function createFormData(overrides: Partial<{ email: string; password: string }> = {}): FormData {
  const fd = new FormData();
  fd.set('email', overrides.email ?? 'admin@example.com');
  fd.set('password', overrides.password ?? 'password123');
  return fd;
}

function mockFetchSuccess() {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ accessToken: 'jwt-token-abc123' }),
  });
}

function mockFetchError(status: number, message: string) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  });
}

function mockFetchNetworkError() {
  globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));
}

// ── login ──────────────────────────────────────────────────────────────────

describe('login', () => {
  it('calls the API with email and password', async () => {
    mockFetchSuccess();

    await login(null, createFormData());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
      }),
    );
  });

  it('sets httpOnly cookie on successful login', async () => {
    mockFetchSuccess();

    await login(null, createFormData());

    expect(mockCookieSet).toHaveBeenCalledWith(
      'access_token',
      'jwt-token-abc123',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
  });

  it('returns success=true on valid credentials', async () => {
    mockFetchSuccess();

    const result = await login(null, createFormData());

    expect(result).toEqual({ success: true });
  });

  it('returns error when email is missing', async () => {
    const result = await login(null, createFormData({ email: '' }));

    expect(result).toEqual({
      success: false,
      error: 'Email and password are required',
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns error when password is missing', async () => {
    const result = await login(null, createFormData({ password: '' }));

    expect(result).toEqual({
      success: false,
      error: 'Email and password are required',
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns error message from API on 401', async () => {
    mockFetchError(401, 'Invalid email or password');

    const result = await login(null, createFormData());

    expect(result).toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('returns fallback error when API returns error without message', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const result = await login(null, createFormData());

    expect(result).toEqual({
      success: false,
      error: 'Login failed (500)',
    });
  });

  it('returns error message on network failure', async () => {
    mockFetchNetworkError();

    const result = await login(null, createFormData());

    expect(result).toEqual({
      success: false,
      error: 'Network failure',
    });
  });

  it('sets cookie with 7 day maxAge', async () => {
    mockFetchSuccess();

    await login(null, createFormData());

    const setCall = mockCookieSet.mock.calls[0];
    const options = setCall[2];
    // 7 days in seconds
    expect(options.maxAge).toBe(7 * 24 * 60 * 60);
  });
});

// ── logout ─────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears access_token cookie', async () => {
    try {
      await logout();
    } catch {
      // redirect throws
    }

    expect(mockCookieSet).toHaveBeenCalledWith(
      'access_token',
      '',
      expect.objectContaining({ maxAge: 0, path: '/' }),
    );
  });

  it('redirects to /login', async () => {
    await expect(logout()).rejects.toThrow('REDIRECT: /login');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });
});
