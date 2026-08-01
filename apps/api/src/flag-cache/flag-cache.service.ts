import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

/**
 * Resolved flag configuration stored in the cache.
 * Plain JSON (string/boolean/number/string[]) — serialized by Keyv's default
 * JSON serializer (D2), no manual stringify/parse needed.
 */
export interface FlagConfig {
  id: string;
  enabled: boolean;
  rolloutPct: number;
  whitelist: string[];
}

/**
 * Minimal structural type for the injected global cache manager.
 *
 * cache-manager is not a direct dependency (pnpm strict layout resolves it
 * only inside @nestjs/cache-manager), so we type just the surface this
 * service uses: get / set / del. Swapping the cache backend (e.g. ElastiCache)
 * only touches this file.
 */
interface CacheLike {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

/**
 * Cache TTL in milliseconds. cache-manager v5+ uses ms, NOT seconds (D3):
 * 30s = 30_000. Single source of truth shared with the global CacheModule
 * registration in AppModule.
 */
export const FLAG_CACHE_TTL = 30_000;

@Injectable()
export class FlagCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: CacheLike) {}

  /** Logical cache key: flag:{name} (e.g. flag:new-checkout). */
  private key(name: string): string {
    return `flag:${name}`;
  }

  /**
   * Resolve a cached flag config.
   * Miss (undefined) and Redis errors both normalize to null — callers
   * treat null as a cache miss and fall back to the DB. Never throws.
   */
  async get(name: string): Promise<FlagConfig | null> {
    try {
      const config = await this.cache.get<FlagConfig>(this.key(name));
      return config ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Store a flag config with the 30s TTL (explicit, in ms).
   * Errors are swallowed — a failed write just means the next evaluation
   * re-reads from the DB. Never throws.
   */
  async set(name: string, config: FlagConfig): Promise<void> {
    try {
      await this.cache.set(this.key(name), config, FLAG_CACHE_TTL);
    } catch {
      // Redis down → nothing cached; the write path stays correct
    }
  }

  /**
   * Delete a cached flag config (eager invalidation after mutations).
   * Errors are swallowed — a stale entry expires within the 30s TTL backstop.
   * Never throws.
   */
  async del(name: string): Promise<void> {
    try {
      await this.cache.del(this.key(name));
    } catch {
      // Redis down → stale until TTL expiry
    }
  }
}
