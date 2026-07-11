import { Module } from '@nestjs/common';
import { MetricsService } from './application/metrics.service';
import { MetricsController } from './presentation/metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
