import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { MetricsService } from '../application/metrics.service';
import type { MetricsSummary } from '@fp/shared';

@UseGuards(AuthGuard)
@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics(): Promise<MetricsSummary> {
    return this.metricsService.getMetrics();
  }
}
