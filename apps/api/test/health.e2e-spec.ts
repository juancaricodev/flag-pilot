import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './helpers/create-test-app';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  describe('GET /health', () => {
    it('returns 200 with { status: "ok" } when no auth is provided', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);

      expect(res.body).toEqual({ status: 'ok' });
    });

    it('returns 200 when a Bearer token is provided (auth ignored)', async () => {
      const fakeToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const res = await request(app.getHttpServer())
        .get('/health')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(200);

      expect(res.body).toEqual({ status: 'ok' });
    });

    it('returns 200 when an expired token is provided (auth ignored)', async () => {
      // Token with exp: 0 (expired in 1970)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid_signature';

      const res = await request(app.getHttpServer())
        .get('/health')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200);

      expect(res.body).toEqual({ status: 'ok' });
    });
  });
});
