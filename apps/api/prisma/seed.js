"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
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
//# sourceMappingURL=seed.js.map