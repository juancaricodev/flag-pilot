import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Auto-detect the Docker socket when running under Colima and disable Ryuk.
 *
 * Colima runs Docker inside a macOS VM — the host socket at ~/.colima/ doesn't
 * exist inside the VM, so Ryuk (testcontainers' resource reaper) can't bind-mount
 * it into its cleanup container. Disabling Ryuk is harmless locally; our own
 * globalTeardown handles cleanup.
 */
function ensureDockerHost(): void {
  if (process.env.DOCKER_HOST) return;

  const colimaSocket = path.join(os.homedir(), '.colima', 'default', 'docker.sock');
  if (fs.existsSync(colimaSocket)) {
    process.env.DOCKER_HOST = `unix://${colimaSocket}`;
    process.env.TESTCONTAINERS_RYUK_DISABLED = 'true';
  }
}

export default async function () {
  ensureDockerHost();
  console.log('\n🐳 Starting PostgreSQL + Redis test containers...');

  // Start both containers in parallel to cut CI wall time
  const [pg, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('flag_pilot_test')
      .withStartupTimeout(90000) // 90s — GitHub Actions runners are slower than local
      .start(),
    new RedisContainer('redis:7-alpine').withStartupTimeout(90000).start(),
  ]);

  const uri = pg.getConnectionUri();
  const redisUri = redis.getConnectionUrl();
  const metaPath = path.join(__dirname, '.testcontainers.json');

  // Persist URIs + containerIds so globalTeardown can stop both containers
  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      uri,
      containerId: pg.getId(),
      redisUri,
      redisContainerId: redis.getId(),
    }),
  );

  // Run migrations against the temporary database
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: uri },
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  console.log(`\n✅ Test PostgreSQL ready at ${uri}`);
  console.log(`✅ Test Redis ready at ${redisUri}\n`);
}
