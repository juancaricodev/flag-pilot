import { Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FlagsModule } from './flags/flags.module';
import { AuditModule } from './audit/audit.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AuthModule } from './auth/auth.module';
import { MetricsModule } from './metrics/metrics.module';
import { FlagCacheModule } from './flag-cache/flag-cache.module';
import { FLAG_CACHE_TTL } from './flag-cache/flag-cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const store = new Keyv({
          store: new KeyvRedis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
          namespace: 'flag',
        });

        // Keyv emits 'error' on connection failures. An
        // unhandled 'error' event on an EventEmitter crashes the Node process.
        // The FlagCacheService wrapper try/catches every op as belt-and-braces.
        store.on('error', (err: Error) =>
          Logger.warn(`Redis error — degrading to cache miss: ${err.message}`, 'FlagCache'),
        );

        return { stores: [store], ttl: FLAG_CACHE_TTL };
      },
    }),
    PrismaModule,
    FlagsModule,
    AuditModule,
    EvaluationModule,
    AuthModule,
    MetricsModule,
    FlagCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
