import { Module } from '@nestjs/common';
import { EvaluationController } from './presentation/evaluation.controller';
import { EvaluationService } from './application/evaluation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FlagCacheModule } from '../flag-cache/flag-cache.module';

@Module({
  imports: [PrismaModule, FlagCacheModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
