import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FlagsModule } from './flags/flags.module';
import { AuditModule } from './audit/audit.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, FlagsModule, AuditModule, EvaluationModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
