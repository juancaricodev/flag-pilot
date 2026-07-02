import path from 'path';

const rootDir = process.cwd();

export default {
  'apps/api/src/**/*.ts': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `pnpm --filter api exec eslint --fix ${filenames.join(' ')}`,
  ],
  'apps/api/test/**/*.ts': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
  ],
  'apps/dashboard/**/*.{ts,tsx}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `pnpm --filter dashboard exec eslint --fix ${filenames.join(' ')}`,
  ],
  '*.{json,md,yaml}': ['prettier --write'],
};
