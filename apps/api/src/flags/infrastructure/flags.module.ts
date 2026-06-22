import { Module } from '@nestjs/common';
import { FlagsController } from '../presentation/flags.controller';
import { FlagsService } from '../application/flags.service';
import { AuditModule } from '../../audit/infrastructure/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FlagsController],
  providers: [FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}
