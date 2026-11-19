import { execFileSync } from 'node:child_process';
import { INestApplication } from '@nestjs/common';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import request from 'supertest';
import { EvaluationService } from '../src/evaluation/application/evaluation.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, createTestApp } from './helpers/create-test-app';
import { ensureTestRedisConnection } from './helpers/test-db';

describe('Evaluation during a Redis outage (e2e)', () => {
  let app: INestApplication | undefined;
  let redis: StartedRedisContainer | undefined;
  let redisPaused = false;
  let evaluationAfterOutage: Promise<boolean> | undefined;

  beforeEach(async () => {
    redis = await new RedisContainer('redis:7-alpine').start();
    ensureTestRedisConnection();
    const sharedRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = redis.getConnectionUrl();

    try {
      app = await createTestApp();
    } finally {
      if (sharedRedisUrl === undefined) delete process.env.REDIS_URL;
      else process.env.REDIS_URL = sharedRedisUrl;
    }
  });

  afterEach(async () => {
    try {
      if (redisPaused && redis) {
        execFileSync('docker', ['unpause', redis.getId()], { timeout: 10_000 });
      }
      if (app) {
        try {
          // A client timeout does not cancel the server's evaluation or its database write.
          await evaluationAfterOutage?.catch(() => undefined);
          await cleanDatabase(app);
        } finally {
          await app.close();
        }
      }
    } finally {
      await redis?.stop();
      redis = undefined;
      app = undefined;
      redisPaused = false;
      evaluationAfterOutage = undefined;
    }
  });

  it('returns the PostgreSQL flag value while Redis is unavailable after a successful evaluation', async () => {
    const api = app!;
    const cache = redis!;
    const prisma = api.get(PrismaService);
    const flag = await prisma.flag.create({
      data: { name: 'redis-outage-fallback', enabled: true, rolloutPct: 100, whitelist: [] },
    });
    const evaluate = () =>
      request(api.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: flag.name })
        .timeout({ deadline: 5_000 });

    await evaluate().expect(200, { enabled: true });
    const cached = await cache.exec(['redis-cli', '--scan', '--pattern', `*${flag.name}`]);
    expect(cached.output).toContain(flag.name);
    // Preserve the mapped port so pending server-side commands can drain after the test.
    execFileSync('docker', ['pause', cache.getId()], { timeout: 10_000 });
    redisPaused = true;

    // Make the database value distinguishable from the value used to warm Redis.
    await prisma.flag.update({ where: { id: flag.id }, data: { enabled: false } });

    const service = api.get(EvaluationService);
    const spy = jest.spyOn(service, 'evaluate');
    try {
      await evaluate().expect(200, { enabled: false });
    } finally {
      evaluationAfterOutage = spy.mock.results[0]?.value as Promise<boolean> | undefined;
      spy.mockRestore();
    }
  });

  it('returns the PostgreSQL flag value after a warmed Redis container stops', async () => {
    const api = app!;
    const cache = redis!;
    const prisma = api.get(PrismaService);
    const flag = await prisma.flag.create({
      data: { name: 'redis-hard-stop-fallback', enabled: true, rolloutPct: 100, whitelist: [] },
    });
    const evaluate = () =>
      request(api.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: flag.name })
        .timeout({ deadline: 5_000 });

    await evaluate().expect(200, { enabled: true });
    const cached = await cache.exec(['redis-cli', '--scan', '--pattern', `*${flag.name}`]);
    expect(cached.output).toContain(flag.name);

    await cache.stop();
    redis = undefined;
    await prisma.flag.update({ where: { id: flag.id }, data: { enabled: false } });

    await evaluate().expect(200, { enabled: false });
  });
});
