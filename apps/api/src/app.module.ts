import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FlagsModule } from './flags/infrastructure/flags.module';
import { AuditModule } from './audit/infrastructure/audit.module';
import { EvaluationModule } from './evaluation/infrastructure/evaluation.module';
import { AuthModule } from './auth/infrastructure/auth.module';

@Module({
  imports: [PrismaModule, FlagsModule, AuditModule, EvaluationModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
