/**
 * @jest-environment node
 */

import { toggleFlag, createFlag, updateFlag, deleteFlag } from './flags';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCookieGet = jest.fn();
const mockUpdateTag = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: mockCookieGet,
  })),
}));

jest.mock('next/cache', () => ({
  updateTag: (...args: unknown[]) => mockUpdateTag(...args),
  refresh: (...args: unknown[]) => mockRefresh(...args),
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

  it('calls updateTag("flags") and refresh() on success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccess();

    await toggleFlag('flag-1', true);

    expect(mockUpdateTag).toHaveBeenCalledWith('flags');
    expect(mockRefresh).toHaveBeenCalled();
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

// ── Helpers (createFlag, updateFlag) ────────────────────────────────────────

const sampleFlag = {
  id: 'flag-1',
  name: 'new-checkout',
  description: 'New checkout flow',
  enabled: true,
  rolloutPct: 100,
  whitelist: [],
  status: 'enabled',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-15T00:00:00Z',
};

function mockFetchSuccessWithFlag(flag: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(flag),
  });
}

// ── Tests: createFlag ───────────────────────────────────────────────────────

describe('createFlag', () => {
  it('calls POST with correct URL, method, headers, and body', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccessWithFlag(sampleFlag);

    await createFlag({ name: 'test-flag', enabled: true });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'access_token=jwt-token-abc',
        },
        body: JSON.stringify({ name: 'test-flag', enabled: true }),
      }),
    );
  });

  it('returns { success: true, flag } on API success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccessWithFlag(sampleFlag);

    const result = await createFlag({ name: 'test-flag' });

    expect(result).toEqual({ success: true, flag: sampleFlag });
  });

  it('calls updateTag("flags") and refresh() on success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccessWithFlag(sampleFlag);

    await createFlag({ name: 'test-flag' });

    expect(mockUpdateTag).toHaveBeenCalledWith('flags');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('returns error message from API on 4xx/5xx', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(400, 'Name is required');

    const result = await createFlag({ name: '' });

    expect(result).toEqual({ error: 'Name is required' });
  });

  it('returns fallback error when API response has no message', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(500);

    const result = await createFlag({ name: 'test' });

    expect(result).toEqual({ error: 'Failed to create flag' });
  });

  it('returns fallback error on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    const result = await createFlag({ name: 'test' });

    expect(result).toEqual({ error: 'Failed to create flag' });
  });

  it('returns error when cookie is missing', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await createFlag({ name: 'test' });

    expect(result).toEqual({ error: 'Not authenticated' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

// ── Tests: updateFlag ───────────────────────────────────────────────────────

describe('updateFlag', () => {
  it('calls PATCH with correct URL, method, headers, and body', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccessWithFlag(sampleFlag);

    await updateFlag('flag-1', { description: 'Updated description' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags/flag-1'),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'access_token=jwt-token-abc',
        },
        body: JSON.stringify({ description: 'Updated description' }),
      }),
    );
  });

  it('returns { success: true, flag } on API success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccessWithFlag(sampleFlag);

    const result = await updateFlag('flag-1', { enabled: false });

    expect(result).toEqual({ success: true, flag: sampleFlag });
  });

  it('calls updateTag("flags") and refresh() on success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccessWithFlag(sampleFlag);

    await updateFlag('flag-1', { enabled: false });

    expect(mockUpdateTag).toHaveBeenCalledWith('flags');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('returns error message from API on 4xx/5xx', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(404, 'Flag not found');

    const result = await updateFlag('flag-unknown', {});

    expect(result).toEqual({ error: 'Flag not found' });
  });

  it('returns fallback error when API response has no message', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(500);

    const result = await updateFlag('flag-1', {});

    expect(result).toEqual({ error: 'Failed to update flag' });
  });

  it('returns fallback error on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    const result = await updateFlag('flag-1', {});

    expect(result).toEqual({ error: 'Failed to update flag' });
  });

  it('returns error when cookie is missing', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await updateFlag('flag-1', {});

    expect(result).toEqual({ error: 'Not authenticated' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

// ── Tests: deleteFlag ───────────────────────────────────────────────────────

describe('deleteFlag', () => {
  it('calls DELETE with correct URL, method, and headers', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccess();

    await deleteFlag('flag-1');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags/flag-1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: {
          Cookie: 'access_token=jwt-token-abc',
        },
      }),
    );
  });

  it('returns { success: true } on API success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccess();

    const result = await deleteFlag('flag-1');

    expect(result).toEqual({ success: true });
  });

  it('calls updateTag("flags") and refresh() on success', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchSuccess();

    await deleteFlag('flag-1');

    expect(mockUpdateTag).toHaveBeenCalledWith('flags');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('returns error message from API on 4xx/5xx', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(404, 'Flag not found');

    const result = await deleteFlag('flag-unknown');

    expect(result).toEqual({ error: 'Flag not found' });
  });

  it('returns fallback error when API response has no message', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(500);

    const result = await deleteFlag('flag-1');

    expect(result).toEqual({ error: 'Failed to delete flag' });
  });

  it('returns fallback error on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    const result = await deleteFlag('flag-1');

    expect(result).toEqual({ error: 'Failed to delete flag' });
  });

  it('returns error when cookie is missing', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await deleteFlag('flag-1');

    expect(result).toEqual({ error: 'Not authenticated' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
