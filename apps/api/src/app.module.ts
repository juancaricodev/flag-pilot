import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FlagsModule } from './flags/flags.module';
import { AuditModule } from './audit/audit.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AuthModule } from './auth/auth.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [PrismaModule, FlagsModule, AuditModule, EvaluationModule, AuthModule, MetricsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
