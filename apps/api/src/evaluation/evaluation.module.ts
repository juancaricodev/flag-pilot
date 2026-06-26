import { Module } from '@nestjs/common';
import { EvaluationController } from './presentation/evaluation.controller';
import { EvaluationService } from './application/evaluation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
