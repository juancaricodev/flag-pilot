import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface FlagConfig {
  id: string;
  enabled: boolean;
  rolloutPct: number;
  whitelist: string[];
}

@Injectable()
export class EvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(flagName: string): Promise<boolean> {
    const flag = await this.prisma.flag.findUnique({ where: { name: flagName } });

    if (!flag) {
      // Safe default: non-existent flags are disabled
      // No evaluation event recorded — flagId is required in the schema
      return false;
    }

    const result = flag.enabled;

    await this.recordEvaluation({
      flagId: flag.id,
      userId: null,
      result,
    });

    return result;
  }

  async evaluateWithContext(flagName: string, userId: string): Promise<boolean> {
    const flag = await this.prisma.flag.findUnique({ where: { name: flagName } });

    if (!flag) {
      return false;
    }

    const result = this.resolveFlag(flag, userId);

    await this.recordEvaluation({
      flagId: flag.id,
      userId,
      result,
    });

    return result;
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
