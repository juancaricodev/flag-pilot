import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export default function () {
  const metaPath = path.join(__dirname, '.testcontainers.json');

  if (!fs.existsSync(metaPath)) {
    console.warn('⚠️  No test container metadata found — nothing to tear down.');
    return;
  }

  const { containerId, redisContainerId } = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as {
    containerId: string;
    redisContainerId?: string;
  };

  for (const id of [containerId, redisContainerId].filter(Boolean) as string[]) {
    try {
      execSync(`docker rm -f ${id}`, { stdio: 'ignore' });
    } catch {
      console.warn('⚠️  Could not stop container — may have been reaped by Ryuk already.');
    }
  }

  console.log('🧹 Test containers stopped and removed.');
  fs.unlinkSync(metaPath);
}
