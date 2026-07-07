/**
 * @jest-environment node
 */

import { getFlags, getFlag } from './flags';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCookieGet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: mockCookieGet,
  })),
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

function mockFetchFlags(data: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
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

const sampleFlags = [
  {
    id: 'flag-1',
    name: 'new-checkout',
    description: 'New checkout flow',
    enabled: true,
    rolloutPct: 100,
    whitelist: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'flag-2',
    name: 'dark-mode',
    description: null,
    enabled: false,
    rolloutPct: 0,
    whitelist: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
  },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe('getFlags', () => {
  it('fetches flags from the API', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchFlags(sampleFlags);

    const result = await getFlags();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'access_token=jwt-token-abc',
        }),
      }),
    );
    expect(result).toEqual(sampleFlags);
  });

  it('returns an empty array when there are no flags', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchFlags([]);

    const result = await getFlags();

    expect(result).toEqual([]);
  });

  it('includes next: { tags: ["flags"] } in the fetch options', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchFlags(sampleFlags);

    await getFlags();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags'),
      expect.objectContaining({
        next: { tags: ['flags'] },
      }),
    );
  });

  it('throws when no access_token cookie is present', async () => {
    mockCookieGet.mockReturnValue(undefined);

    await expect(getFlags()).rejects.toThrow('Not authenticated');
  });

  it('throws on API error response', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(500, 'Internal server error');

    await expect(getFlags()).rejects.toThrow('Failed to fetch flags (500)');
  });

  it('throws on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    await expect(getFlags()).rejects.toThrow('Network failure');
  });
});

// ── Helpers (getFlag) ───────────────────────────────────────────────────────

function mockFetchFlag(data: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

const sampleFlag = {
  id: 'flag-1',
  name: 'new-checkout',
  description: 'New checkout flow',
  enabled: true,
  rolloutPct: 100,
  whitelist: [],
  status: 'enabled' as const,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-15T00:00:00Z',
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('getFlag', () => {
  it('fetches a single flag from the API', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchFlag(sampleFlag);

    const result = await getFlag('flag-1');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags/flag-1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'access_token=jwt-token-abc',
        }),
      }),
    );
    expect(result).toEqual(sampleFlag);
  });

  it('includes next: { tags: ["flags"] } in the fetch options', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchFlag(sampleFlag);

    await getFlag('flag-1');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/flags/flag-1'),
      expect.objectContaining({
        next: { tags: ['flags'] },
      }),
    );
  });

  it('throws when no access_token cookie is present', async () => {
    mockCookieGet.mockReturnValue(undefined);

    await expect(getFlag('flag-1')).rejects.toThrow('Not authenticated');
  });

  it('throws on API 404 response', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Flag not found' }),
    });

    await expect(getFlag('flag-1')).rejects.toThrow('Failed to fetch flag (404)');
  });

  it('throws on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    await expect(getFlag('flag-1')).rejects.toThrow('Network failure');
  });
});
