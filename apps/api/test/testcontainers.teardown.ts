import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export default async function () {
  const metaPath = path.join(__dirname, '.testcontainers.json');

  if (!fs.existsSync(metaPath)) {
    console.warn('⚠️  No test container metadata found — nothing to tear down.');
    return;
  }

  const { containerId } = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  try {
    execSync(`docker rm -f ${containerId}`, { stdio: 'ignore' });
    console.log('🧹 Test container stopped and removed.');
  } catch {
    console.warn('⚠️  Could not stop container — may have been reaped by Ryuk already.');
  }

  fs.unlinkSync(metaPath);
}
