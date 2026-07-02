import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from './helpers/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    // Seed an admin user (same credentials as the seed script)
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        id: 'test-admin',
        email: 'admin@flagpilot.dev',
        passwordHash,
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  // -----------------------------------------------------------------------
  // POST /api/auth/login
  // -----------------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    it('returns 200 with an access token and sets a cookie when credentials are valid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@flagpilot.dev', password: 'admin123' })
        .expect(200);

      // Response body contains the token
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');

      // httpOnly cookie is set
      const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      const authCookie = cookies!.find((c: string) => c.startsWith('access_token='));
      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('HttpOnly');
      expect(authCookie).toContain('Path=/');
    });

    it('returns 401 when the password is incorrect', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@flagpilot.dev', password: 'wrong-password' })
        .expect(401);

      expect(res.body).toHaveProperty('message');
      // Should not leak details about which field is wrong
      expect(res.body.message).not.toContain('email');
    });

    it('returns 401 when the email does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'unknown@test.com', password: 'any-password' })
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    it('returns the same error message for wrong email and wrong password (no user enumeration)', async () => {
      const [wrongEmail, wrongPassword] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'unknown@test.com', password: 'any-password' }),
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'admin@flagpilot.dev', password: 'wrong-password' }),
      ]);

      expect(wrongEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/auth/logout
  // -----------------------------------------------------------------------
  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears the access_token cookie', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/logout').expect(200);

      const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();

      const authCookie = cookies!.find((c: string) => c.startsWith('access_token='));
      expect(authCookie).toBeDefined();
      // Cleared cookie should have max-age=0 or expires in the past
      expect(authCookie).toMatch(/access_token=;?/);
    });
  });
});
