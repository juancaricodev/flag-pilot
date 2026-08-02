import { Module } from '@nestjs/common';
import { FlagCacheService } from './flag-cache.service';

/**
 * Infra module mirroring src/prisma/: single home for cache key format,
 * TTL, serialization and error-swallowing. No imports — the global
 * CACHE_MANAGER (registered in AppModule) is injectable everywhere.
 */
@Module({
  providers: [FlagCacheService],
  exports: [FlagCacheService],
})
export class FlagCacheModule {}
