import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FlagsModule } from './flags/infrastructure/flags.module';

@Module({
  imports: [PrismaModule, FlagsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
