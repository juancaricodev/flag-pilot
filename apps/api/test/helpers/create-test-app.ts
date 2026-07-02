import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ensureTestDbConnection } from './test-db';

/**
 * Bootstraps a NestJS application identical to main.ts but without
 * listening — use supertest(app.getHttpServer()) for HTTP requests.
 */
export async function createTestApp(): Promise<INestApplication> {
  // Set process.env.DATABASE_URL before any module is instantiated
  ensureTestDbConnection();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply the same middleware & pipes as main.ts
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.init();
  return app;
}

/**
 * Clean all rows from every table (respecting FK constraints).
 * Call from afterEach / afterAll in each test file.
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);

  // Delete in FK-safe order: children before parents
  await prisma.evaluation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.flag.deleteMany();
  await prisma.admin.deleteMany();
}
