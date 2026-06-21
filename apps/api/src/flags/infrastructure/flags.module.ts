import { Module } from '@nestjs/common';
import { FlagsController } from '../presentation/flags.controller';
import { FlagsService } from '../application/flags.service';

@Module({
  controllers: [FlagsController],
  providers: [FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}
