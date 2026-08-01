import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './helpers/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { FlagsService } from '../src/flags/application/flags.service';

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

  // -----------------------------------------------------------------------
  // Redis cache-aside (30s TTL)
  // -----------------------------------------------------------------------
  describe('Redis cache-aside', () => {
    it('serves a stale cached config until the 30s TTL (cache hit skips the DB)', async () => {
      const flag = await prisma.flag.create({
        data: {
          id: 'cache-hit-a',
          name: 'cache-hit-a',
          description: 'Proves the cache serves evaluations',
          enabled: true,
          rolloutPct: 100,
          whitelist: [],
        },
      });

      // 1st call → cache miss → reads DB → warms the cache
      const first = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'cache-hit-a' })
        .expect(200);
      expect(first.body).toEqual({ enabled: true });

      // 2nd call → cache hit (no DB read needed)
      const second = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'cache-hit-a' })
        .expect(200);
      expect(second.body).toEqual({ enabled: true });

      // Bypass the API's eager invalidation with a DIRECT DB write (update —
      // a delete would cascade the Evaluation rows via the FK onDelete:
      // Cascade and break the final recordEvaluation).
      await prisma.flag.update({
        where: { id: flag.id },
        data: { enabled: false },
      });

      const dbRow = await prisma.flag.findUnique({ where: { id: flag.id } });
      expect(dbRow?.enabled).toBe(false); // the DB now disagrees…

      // …yet the API still answers true → the answer came from the Redis cache
      const third = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'cache-hit-a' })
        .expect(200);
      expect(third.body).toEqual({ enabled: true });

      // recordEvaluation fires on hits too — exactly one row per evaluation
      const rows = await prisma.evaluation.count({ where: { flagId: flag.id } });
      expect(rows).toBe(3);

      await prisma.flag.delete({ where: { id: flag.id } });
    });
  });

  // -----------------------------------------------------------------------
  // Eager cache invalidation via real FlagService mutations (D5)
  // -----------------------------------------------------------------------
  describe('Flag mutations invalidate the cache', () => {
    let flags: FlagsService;

    beforeAll(() => {
      flags = app.get(FlagsService);
    });

    it('update(enabled) takes effect immediately', async () => {
      const flag = await flags.create({ name: 'inv-update', enabled: false, rolloutPct: 100 });

      await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'inv-update' })
        .expect(200, { enabled: false });

      await flags.update(flag.id, { enabled: true });

      // Without invalidation this would return the stale cached `false`
      const res = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'inv-update' })
        .expect(200);

      expect(res.body).toEqual({ enabled: true });
    });

    it('rename invalidates the OLD key — the old name stops answering true', async () => {
      const flag = await flags.create({ name: 'inv-rename-old', enabled: true, rolloutPct: 100 });

      await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'inv-rename-old' })
        .expect(200, { enabled: true });

      await flags.update(flag.id, { name: 'inv-rename-new' });

      // Stale `flag:inv-rename-old` cache entry would say true — it must not
      const oldName = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'inv-rename-old' })
        .expect(200);
      expect(oldName.body).toEqual({ enabled: false });

      // The new name reads fresh from the DB
      const newName = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'inv-rename-new' })
        .expect(200);
      expect(newName.body).toEqual({ enabled: true });
    });

    it('remove invalidates the cache — a deleted flag stops answering true', async () => {
      const flag = await flags.create({ name: 'inv-remove', enabled: true, rolloutPct: 100 });

      await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'inv-remove' })
        .expect(200, { enabled: true });

      await flags.remove(flag.id);

      // Without invalidation the stale cache would say true (and the hit would
      // 500 on recordEvaluation against the deleted flagId)
      const res = await request(app.getHttpServer())
        .post('/api/evaluate')
        .send({ flag: 'inv-remove' })
        .expect(200);

      expect(res.body).toEqual({ enabled: false });
    });
  });
});
