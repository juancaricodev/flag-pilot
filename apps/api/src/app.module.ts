import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FlagsModule } from './flags/infrastructure/flags.module';
import { AuditModule } from './audit/infrastructure/audit.module';
import { EvaluationModule } from './evaluation/infrastructure/evaluation.module';

@Module({
  imports: [PrismaModule, FlagsModule, AuditModule, EvaluationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
