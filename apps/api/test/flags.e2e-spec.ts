import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from './helpers/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Flags (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    // Seed an admin user for authenticated requests
    // Use upsert because the auth test may have already created this admin
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.upsert({
      where: { email: 'admin@flagpilot.dev' },
      update: { passwordHash },
      create: {
        id: 'flags-test-admin',
        email: 'admin@flagpilot.dev',
        passwordHash,
      },
    });

    // Login once and reuse the cookie across authenticated tests
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@flagpilot.dev', password: 'admin123' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    adminCookie = cookies.find((c: string) => c.startsWith('access_token='))!;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  // -----------------------------------------------------------------------
  // Unauthenticated access
  // -----------------------------------------------------------------------
  describe('unauthenticated access', () => {
    it('GET /api/flags returns 401 without auth cookie', async () => {
      await request(app.getHttpServer()).get('/api/flags').expect(401);
    });

    it('POST /api/flags returns 401 without auth cookie', async () => {
      await request(app.getHttpServer()).post('/api/flags').send({ name: 'test-flag' }).expect(401);
    });
  });

  // -----------------------------------------------------------------------
  // Authenticated CRUD
  // -----------------------------------------------------------------------
  describe('authenticated CRUD', () => {
    let createdFlagId: string;

    it('POST /api/flags creates a flag (UC-01)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/flags')
        .set('Cookie', adminCookie)
        .send({
          name: 'test-crud-flag',
          description: 'Integration test flag',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('test-crud-flag');
      expect(res.body.description).toBe('Integration test flag');
      expect(res.body.enabled).toBe(false);
      expect(res.body.rolloutPct).toBe(0);
      expect(res.body.whitelist).toEqual([]);

      createdFlagId = res.body.id;
    });

    it('POST /api/flags returns 409 when name already exists (UC-01 edge)', async () => {
      await request(app.getHttpServer())
        .post('/api/flags')
        .set('Cookie', adminCookie)
        .send({ name: 'test-crud-flag' })
        .expect(409);
    });

    it('GET /api/flags returns all flags (UC-02)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/flags')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const flag = res.body.find((f: any) => f.id === createdFlagId);
      expect(flag).toBeDefined();
      expect(flag.name).toBe('test-crud-flag');
    });

    it('GET /api/flags/:id returns a single flag (UC-02)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/flags/${createdFlagId}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.name).toBe('test-crud-flag');
    });

    it('PATCH /api/flags/:id toggles a flag (UC-03)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/flags/${createdFlagId}`)
        .set('Cookie', adminCookie)
        .send({ enabled: true })
        .expect(200);

      expect(res.body.enabled).toBe(true);
    });

    it('PATCH /api/flags/:id updates rollout and whitelist (UC-06, UC-07)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/flags/${createdFlagId}`)
        .set('Cookie', adminCookie)
        .send({ rolloutPct: 50, whitelist: ['user-a', 'user-b'] })
        .expect(200);

      expect(res.body.rolloutPct).toBe(50);
      expect(res.body.whitelist).toEqual(['user-a', 'user-b']);
    });

    it('PATCH /api/flags/:id returns 404 for non-existent flag', async () => {
      await request(app.getHttpServer())
        .patch('/api/flags/non-existent-id')
        .set('Cookie', adminCookie)
        .send({ enabled: true })
        .expect(404);
    });

    it('DELETE /api/flags/:id removes a flag (UC-04)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/flags/${createdFlagId}`)
        .set('Cookie', adminCookie)
        .expect(200);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/api/flags/${createdFlagId}`)
        .set('Cookie', adminCookie)
        .expect(404);
    });

    it('DELETE /api/flags/:id returns 404 for non-existent flag (UC-04 edge)', async () => {
      await request(app.getHttpServer())
        .delete('/api/flags/non-existent-id')
        .set('Cookie', adminCookie)
        .expect(404);
    });
  });

  // -----------------------------------------------------------------------
  // Audit log
  // -----------------------------------------------------------------------
  describe('audit log (UC-05)', () => {
    let flagId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/flags')
        .set('Cookie', adminCookie)
        .send({ name: 'test-audit-flag' })
        .expect(201);

      flagId = res.body.id;
    });

    it('GET /api/flags/:id/audit returns the change history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}/audit`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].action).toBe('CREATE');
      expect(res.body[0].flagId).toBe(flagId);
    });

    it('records a TOGGLE action when a flag is toggled', async () => {
      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .set('Cookie', adminCookie)
        .send({ enabled: true })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}/audit`)
        .set('Cookie', adminCookie)
        .expect(200);

      const toggleEntry = res.body.find((e: any) => e.action === 'TOGGLE');
      expect(toggleEntry).toBeDefined();
      // The service snapshots the entire flag state as a JSON string
      expect(toggleEntry.fromState).toContain('"enabled":false');
      expect(toggleEntry.toState).toContain('"enabled":true');
    });
  });
});
