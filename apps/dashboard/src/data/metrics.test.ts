/**
 * @jest-environment node
 */

import { getMetrics } from './metrics';

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

function mockFetchMetrics(data: unknown) {
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

const sampleMetrics = {
  totalEvaluations: 150,
  flags: [
    {
      flagId: 'flag-1',
      flagName: 'dark-mode',
      total: 100,
      enabled: 60,
      disabled: 40,
    },
    {
      flagId: 'flag-2',
      flagName: 'new-checkout',
      total: 50,
      enabled: 50,
      disabled: 0,
    },
  ],
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('getMetrics', () => {
  it('fetches metrics summary from the API', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchMetrics(sampleMetrics);

    const result = await getMetrics();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/metrics'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'access_token=jwt-token-abc',
        }),
      }),
    );
    expect(result).toEqual(sampleMetrics);
  });

  it('uses no-store cache strategy', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchMetrics(sampleMetrics);

    await getMetrics();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/metrics'),
      expect.objectContaining({
        cache: 'no-store',
      }),
    );
  });

  it('throws when no access_token cookie is present', async () => {
    mockCookieGet.mockReturnValue(undefined);

    await expect(getMetrics()).rejects.toThrow('Not authenticated');
  });

  it('throws on API error response with status code', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(500, 'Internal server error');

    await expect(getMetrics()).rejects.toThrow('Failed to fetch metrics (500)');
  });

  it('throws on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    await expect(getMetrics()).rejects.toThrow('Network failure');
  });
});
