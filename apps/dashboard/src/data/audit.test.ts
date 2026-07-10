/**
 * @jest-environment node
 */

import { getAuditLogs } from './audit';

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

function mockFetchAuditLogs(data: unknown) {
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

const sampleLogs = [
  {
    id: 'audit-1',
    flagId: 'flag-1',
    flagName: 'dark-mode',
    action: 'CREATE',
    fromState: null,
    toState: '{"name":"dark-mode","enabled":false}',
    reason: null,
    createdAt: '2026-06-25T10:00:00Z',
  },
  {
    id: 'audit-2',
    flagId: 'flag-2',
    flagName: 'new-checkout',
    action: 'TOGGLE',
    fromState: '{"name":"new-checkout","enabled":false}',
    toState: '{"name":"new-checkout","enabled":true}',
    reason: null,
    createdAt: '2026-06-25T11:00:00Z',
  },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe('getAuditLogs', () => {
  it('fetches audit logs from the API', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchAuditLogs(sampleLogs);

    const result = await getAuditLogs();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/audit'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'access_token=jwt-token-abc',
        }),
      }),
    );
    expect(result).toEqual(sampleLogs);
  });

  it('uses no-store cache strategy', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchAuditLogs([]);

    await getAuditLogs();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/audit'),
      expect.objectContaining({
        cache: 'no-store',
      }),
    );
  });

  it('returns an empty array when there are no audit logs', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchAuditLogs([]);

    const result = await getAuditLogs();

    expect(result).toEqual([]);
  });

  it('throws when no access_token cookie is present', async () => {
    mockCookieGet.mockReturnValue(undefined);

    await expect(getAuditLogs()).rejects.toThrow('Not authenticated');
  });

  it('throws on API error response', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchError(500, 'Internal server error');

    await expect(getAuditLogs()).rejects.toThrow('Failed to fetch audit logs (500)');
  });

  it('throws on network failure', async () => {
    mockCookieGet.mockReturnValue({ value: 'jwt-token-abc' });
    mockFetchNetworkError();

    await expect(getAuditLogs()).rejects.toThrow('Network failure');
  });
});
