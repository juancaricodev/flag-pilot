import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './helpers/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Evaluate (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    // Seed a flag for the basic tests
    await prisma.flag.create({
      data: {
        id: 'eval-test-enabled',
        name: 'test-flag-enabled',
        description: 'An enabled flag for testing',
        enabled: true,
        rolloutPct: 100,
        whitelist: [],
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  // -----------------------------------------------------------------------
  // POST /api/evaluate
  // -----------------------------------------------------------------------
  describe('POST /api/evaluate', () => {
    it('returns enabled: true when the flag exists and is enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'test-flag-enabled' })
        .expect(200);

      expect(res.body).toEqual({ enabled: true });
    });

    it('returns enabled: false when the flag does not exist (safe default)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'non-existent-flag' })
        .expect(200);

      expect(res.body).toEqual({ enabled: false });
    });

    it('records an Evaluation event on every call', async () => {
      const before = await prisma.evaluation.count();

      await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'test-flag-enabled' })
        .expect(200);

      const after = await prisma.evaluation.count();
      expect(after).toBe(before + 1);
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/evaluate/context
  // -----------------------------------------------------------------------
  describe('POST /api/evaluate/context', () => {
    it('returns enabled: true for a whitelisted user even when flag is disabled', async () => {
      await prisma.flag.create({
        data: {
          id: 'eval-whitelist',
          name: 'test-whitelist',
          enabled: false,
          rolloutPct: 0,
          whitelist: ['user-whitelisted'],
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/evaluate/context')
        .send({ flag: 'test-whitelist', userId: 'user-whitelisted' })
        .expect(200);

      expect(res.body).toEqual({ enabled: true });

      await prisma.flag.delete({ where: { id: 'eval-whitelist' } });
    });

    it('returns enabled: false for a non-whitelisted user when flag is disabled', async () => {
      await prisma.flag.create({
        data: {
          id: 'eval-not-whitelisted',
          name: 'test-not-whitelisted',
          enabled: false,
          rolloutPct: 0,
          whitelist: ['user-whitelisted'],
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/evaluate/context')
        .send({ flag: 'test-not-whitelisted', userId: 'user-other' })
        .expect(200);

      expect(res.body).toEqual({ enabled: false });

      await prisma.flag.delete({ where: { id: 'eval-not-whitelisted' } });
    });

    it('returns enabled: true for a user within the rollout percentage', async () => {
      await prisma.flag.create({
        data: {
          id: 'eval-rollout-in',
          name: 'test-rollout-in',
          enabled: true,
          rolloutPct: 100, // everyone qualifies
          whitelist: [],
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/evaluate/context')
        .send({ flag: 'test-rollout-in', userId: 'user-any' })
        .expect(200);

      expect(res.body).toEqual({ enabled: true });

      await prisma.flag.delete({ where: { id: 'eval-rollout-in' } });
    });

    it('returns enabled: false for a user outside the rollout percentage', async () => {
      await prisma.flag.create({
        data: {
          id: 'eval-rollout-out',
          name: 'test-rollout-out',
          enabled: true,
          rolloutPct: 0, // nobody qualifies
          whitelist: [],
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/evaluate/context')
        .send({ flag: 'test-rollout-out', userId: 'user-any' })
        .expect(200);

      expect(res.body).toEqual({ enabled: false });

      await prisma.flag.delete({ where: { id: 'eval-rollout-out' } });
    });
  });
});
