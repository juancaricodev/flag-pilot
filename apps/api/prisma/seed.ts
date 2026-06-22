import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const flags = [
    {
      name: 'new-checkout',
      description: 'New checkout flow with improved UX',
      enabled: false,
      rolloutPct: 0,
      whitelist: [],
    },
    {
      name: 'dark-mode',
      description: 'Dark mode UI for the dashboard',
      enabled: true,
      rolloutPct: 100,
      whitelist: [],
    },
    {
      name: 'beta-api',
      description: 'Beta version of the evaluation API v2',
      enabled: true,
      rolloutPct: 10,
      whitelist: ['user_test_001', 'user_test_002'],
    },
  ];

  for (const flag of flags) {
    const existing = await prisma.flag.findUnique({ where: { name: flag.name } });
    if (existing) {
      console.log(`  ⏭️  Skipped flag: ${flag.name} (already exists)`);
      continue;
    }
    await prisma.flag.create({ data: flag });
    console.log(`  ✅ Created flag: ${flag.name}`);
  }

  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
