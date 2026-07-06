/**
 * @jest-environment node
 */

import { toggleFlag } from './flags';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCookieGet = jest.fn();
const mockRevalidateTag = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: mockCookieGet,
  })),
}));

jest.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
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

function mockFetchSuccess() {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
}

function mockFetchError(status: number, message?: string) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(message ? { message } : {}),
  });
}

function mockFetchNetworkError() {
  globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('toggleFlag', () => {
  it('calls PATCH with correct URL, method, headers, and body', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccess();

    await toggleFlag('flag-1', true);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags/flag-1'),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'access_token=jwt-token-abc',
        },
        body: JSON.stringify({ enabled: true }),
      }),
    );
  });

  it('returns { success: true } on API success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccess();

    const result = await toggleFlag('flag-1', true);

    expect(result).toEqual({ success: true });
  });

  it('calls revalidateTag("flags", "max") on success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccess();

    await toggleFlag('flag-1', true);

    expect(mockRevalidateTag).toHaveBeenCalledWith('flags', 'max');
  });

  it('returns error message from API on 4xx/5xx', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(400, 'Flag is archived');

    const result = await toggleFlag('flag-1', true);

    expect(result).toEqual({ error: 'Flag is archived' });
  });

  it('returns fallback error when API response has no message', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(500);

    const result = await toggleFlag('flag-1', true);

    expect(result).toEqual({ error: 'Failed to toggle flag' });
  });

  it('returns fallback error on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    const result = await toggleFlag('flag-1', true);

    expect(result).toEqual({ error: 'Failed to toggle flag' });
  });

  it('returns error when cookie is missing', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await toggleFlag('flag-1', true);

    expect(result).toEqual({ error: 'Not authenticated' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
