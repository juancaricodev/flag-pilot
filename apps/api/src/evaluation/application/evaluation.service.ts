import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FlagCacheService, FlagConfig } from '../../flag-cache/flag-cache.service';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flagCache: FlagCacheService,
  ) {}

  async evaluate(flagName: string): Promise<boolean> {
    // Cache-aside: a hit serves the cached config without a DB read.
    // FlagCacheService never throws — Redis down degrades to a miss (null).
    const cached = await this.flagCache.get(flagName);
    if (cached) {
      const result = cached.enabled;
      await this.recordEvaluation({
        flagId: cached.id,
        userId: null,
        result,
      });
      return result;
    }

    const flag = await this.prisma.flag.findUnique({ where: { name: flagName } });

    if (!flag) {
      // Safe default: non-existent flags are disabled.
      // No negative caching (no set) — the cache stays clean for the 30s TTL.
      // No evaluation event recorded — flagId is required in the schema.
      return false;
    }

    const config = this.toConfig(flag);
    await this.flagCache.set(flagName, config);

    const result = config.enabled;

    await this.recordEvaluation({
      flagId: config.id,
      userId: null,
      result,
    });

    return result;
  }

  async evaluateWithContext(flagName: string, userId: string): Promise<boolean> {
    const cached = await this.flagCache.get(flagName);
    if (cached) {
      const result = this.resolveFlag(cached, userId);
      await this.recordEvaluation({
        flagId: cached.id,
        userId,
        result,
      });
      return result;
    }

    const flag = await this.prisma.flag.findUnique({ where: { name: flagName } });

    if (!flag) {
      return false;
    }

    const config = this.toConfig(flag);
    await this.flagCache.set(flagName, config);

    const result = this.resolveFlag(config, userId);

    await this.recordEvaluation({
      flagId: config.id,
      userId,
      result,
    });

    return result;
  }

  /** Maps a Prisma flag row to the cacheable FlagConfig (D2 — plain JSON). */
  private toConfig(flag: {
    id: string;
    enabled: boolean;
    rolloutPct: number;
    whitelist: string[];
  }): FlagConfig {
    return {
      id: flag.id,
      enabled: flag.enabled,
      rolloutPct: flag.rolloutPct,
      whitelist: flag.whitelist,
    };
  }

  private resolveFlag(flag: FlagConfig, userId: string): boolean {
    // 1. Whitelist takes precedence over everything
    if (flag.whitelist.includes(userId)) {
      return true;
    }

    // 2. If flag is disabled, return false
    if (!flag.enabled) {
      return false;
    }

    // 3. No rollout means no one gets it (unless whitelisted)
    if (flag.rolloutPct === 0) {
      return false;
    }

    // 4. Full rollout — everyone gets it
    if (flag.rolloutPct === 100) {
      return true;
    }

    // 5. Sticky hashing: same user always gets same result
    const hash = this.stickyHash(userId, flag.id);
    return hash < flag.rolloutPct;
  }

  private stickyHash(userId: string, flagId: string): number {
    const key = `${userId}${flagId}`;
    let hash = 0;

    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Ensure positive modulo
    return Math.abs(hash) % 100;
  }

  private async recordEvaluation(params: {
    flagId: string;
    userId: string | null;
    result: boolean;
  }): Promise<void> {
    await this.prisma.evaluation.create({
      data: {
        flagId: params.flagId,
        userId: params.userId,
        result: params.result,
      },
    });
  }
}
