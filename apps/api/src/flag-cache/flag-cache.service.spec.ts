import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { FlagCacheService, FLAG_CACHE_TTL, FlagConfig } from './flag-cache.service';

describe('FlagCacheService', () => {
  let service: FlagCacheService;

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const config: FlagConfig = {
    id: 'flag-1',
    enabled: true,
    rolloutPct: 100,
    whitelist: ['user-1', 'user-2'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlagCacheService, { provide: CACHE_MANAGER, useValue: mockCache }],
    }).compile();

    service = module.get<FlagCacheService>(FlagCacheService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // get(name) — cache-aside read
  // ---------------------------------------------------------------------------
  describe('get', () => {
    it('returns the cached config on a hit (key format flag:{name})', async () => {
      mockCache.get.mockResolvedValue(config);

      const result = await service.get('new-checkout');

      expect(result).toEqual(config);
      expect(mockCache.get).toHaveBeenCalledWith('flag:new-checkout');
    });

    it('normalizes a miss (undefined) to null', async () => {
      mockCache.get.mockResolvedValue(undefined);

      const result = await service.get('new-checkout');

      expect(result).toBeNull();
      expect(mockCache.get).toHaveBeenCalledWith('flag:new-checkout');
    });

    it('returns null when the cache get rejects (Redis down) — never throws', async () => {
      mockCache.get.mockRejectedValue(new Error('connection refused'));

      const result = await service.get('new-checkout');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // set(name, config) — populates the cache on a miss
  // ---------------------------------------------------------------------------
  describe('set', () => {
    it('stores the config under flag:{name} with the 30s TTL in milliseconds (D3)', async () => {
      mockCache.set.mockResolvedValue(true);

      await service.set('new-checkout', config);

      // Literal 30_000 (not FLAG_CACHE_TTL) — guards the seconds-vs-ms unit trap:
      // a value of 30 here would silently expire entries in 30ms, not 30s.
      expect(mockCache.set).toHaveBeenCalledWith('flag:new-checkout', config, 30_000);
      expect(FLAG_CACHE_TTL).toBe(30_000);
    });

    it('swallows set errors (Redis down) without throwing', async () => {
      mockCache.set.mockRejectedValue(new Error('connection refused'));

      await expect(service.set('new-checkout', config)).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // del(name) — eager invalidation on flag mutations
  // ---------------------------------------------------------------------------
  describe('del', () => {
    it('deletes the key flag:{name}', async () => {
      mockCache.del.mockResolvedValue(true);

      await service.del('new-checkout');

      expect(mockCache.del).toHaveBeenCalledWith('flag:new-checkout');
    });

    it('swallows del errors (Redis down) without throwing', async () => {
      mockCache.del.mockRejectedValue(new Error('connection refused'));

      await expect(service.del('new-checkout')).resolves.toBeUndefined();
    });
  });
});
