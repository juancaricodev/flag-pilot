import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { MetricsSummary } from '@fp/shared';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<MetricsSummary> {
    const [totals, enabledCounts] = await Promise.all([
      this.prisma.evaluation.groupBy({
        by: ['flagId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.evaluation.groupBy({
        by: ['flagId'],
        _count: { id: true },
        where: { result: true },
      }),
    ]);

    if (totals.length === 0) {
      return { totalEvaluations: 0, flags: [] };
    }

    const enabledMap = new Map(enabledCounts.map((e) => [e.flagId, e._count.id]));

    const flagIds = totals.map((e) => e.flagId);
    const flags = await this.prisma.flag.findMany({
      where: { id: { in: flagIds } },
      select: { id: true, name: true },
    });

    const flagNameMap = new Map(flags.map((f) => [f.id, f.name]));

    const totalEvaluations = totals.reduce((sum, e) => sum + e._count.id, 0);

    const flagMetrics = totals.map((e) => {
      const enabled = enabledMap.get(e.flagId) ?? 0;
      return {
        flagId: e.flagId,
        flagName: flagNameMap.get(e.flagId) ?? 'Unknown',
        total: e._count.id,
        enabled,
        disabled: e._count.id - enabled,
      };
    });

    return { totalEvaluations, flags: flagMetrics };
  }
}
