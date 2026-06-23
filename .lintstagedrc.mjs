import path from 'path';

const rootDir = process.cwd();

export default {
  'apps/api/**/*.ts': (filenames) => {
    const apiDir = path.join(rootDir, 'apps/api');
    const relative = filenames.map((f) => path.relative(apiDir, f));
    return [
      `prettier --write ${filenames.join(' ')}`,
      `cd apps/api && pnpm exec eslint --fix ${relative.join(' ')}`,
    ];
  },
  'apps/dashboard/**/*.{ts,tsx}': (filenames) => {
    const dashboardDir = path.join(rootDir, 'apps/dashboard');
    const relative = filenames.map((f) => path.relative(dashboardDir, f));
    return [
      `prettier --write ${filenames.join(' ')}`,
      `cd apps/dashboard && pnpm exec eslint --fix ${relative.join(' ')}`,
    ];
  },
  '*.{json,md,yaml}': ['prettier --write'],
};
