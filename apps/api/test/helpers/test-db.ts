import * as fs from 'fs';
import * as path from 'path';

let connected = false;

/**
 * Reads the testcontainers URI file (written by globalSetup) and sets
 * process.env.DATABASE_URL so PrismaService connects to the test database.
 *
 * Must be called BEFORE app creation (beforeAll of each test suite).
 */
export function ensureTestDbConnection(): void {
  if (connected) return;

  const metaPath = path.resolve(__dirname, '..', '.testcontainers.json');

  if (!fs.existsSync(metaPath)) {
    throw new Error(
      `Test container metadata not found at ${metaPath}.\n` +
        'Did you forget --runInBand? e.g.:\n' +
        '  pnpm --filter api exec jest --config ./test/jest-e2e.json --runInBand',
    );
  }

  const { uri } = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  process.env.DATABASE_URL = uri;
  connected = true;
}
