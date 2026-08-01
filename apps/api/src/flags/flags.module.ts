import { Module } from '@nestjs/common';
import { FlagsController } from './presentation/flags.controller';
import { FlagsService } from './application/flags.service';
import { AuditModule } from '../audit/audit.module';
import { FlagCacheModule } from '../flag-cache/flag-cache.module';

@Module({
  imports: [AuditModule, FlagCacheModule],
  controllers: [FlagsController],
  providers: [FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}
