---
name: flag-pilot-api
description: >
  API conventions for Flag Pilot: NestJS 11 + Prisma 6 + PostgreSQL + Screaming Architecture.
  Trigger: When editing files in apps/api/, creating NestJS modules, or writing API tests.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: '1.0'
---

## When to Use

Apply this skill when:

- Creating or modifying NestJS modules in `apps/api/src/`
- Writing services, controllers, DTOs, or guards
- Adding Prisma queries or migrations
- Writing unit tests (`*.spec.ts`) or E2E tests (`*.e2e-spec.ts`)

---

## Critical Patterns

### Pattern 1: Module Structure — Screaming Architecture by Feature

Each module lives in its own directory and SCREAMS what it does:

```
src/
├── flags/          ← Core domain: feature flag CRUD
├── auth/           ← Authentication + JWT guard
├── audit/          ← Audit log (cross-cutting, used by flags)
├── evaluation/     ← Public evaluation API (no auth)
└── prisma/         ← Shared Prisma infrastructure
```

Each feature module has two internal layers:

| Directory       | Role                        | Files                    |
| --------------- | --------------------------- | ------------------------ |
| `presentation/` | Interface Adapters (NestJS) | Controller, DTOs, Guards |
| `application/`  | Business Logic (Use Cases)  | Service                  |

### Pattern 2: File Naming

```bash
{feature}.module.ts          # NestJS module
{feature}.controller.ts      # REST controller
{feature}.service.ts         # Business logic
{feature}.guard.ts           # Auth guard
{create|update}-{feature}.dto.ts  # DTOs
{feature}.service.spec.ts    # Unit tests (co-located)
```

### Pattern 3: Controller Structure

```typescript
@UseGuards(AuthGuard)
@Controller('api/flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Post()
  async create(@Body() dto: CreateFlagDto): Promise<Flag> {
    return this.flagsService.create(dto);
  }

  @Get()
  async findAll(): Promise<Flag[]> {
    return this.flagsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Flag> {
    return this.flagsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFlagDto): Promise<Flag> {
    return this.flagsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.flagsService.remove(id);
  }
}
```

- `@UseGuards(AuthGuard)` at class level for protected routes
- `@Controller('api/{resource}')` — RESTful prefix
- Endpoints map directly to service methods
- Delegate directly: controller calls service, never duplicates logic

### Pattern 4: Service Layer — Business Logic

```typescript
@Injectable()
export class FlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateFlagDto): Promise<Flag> {
    // 1. Validate business rules
    const existing = await this.prisma.flag.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Flag "${dto.name}" already exists`);

    // 2. Persist
    const flag = await this.prisma.flag.create({ data: { ... } });

    // 3. Map to domain type
    const result = this.toFlag(flag);

    // 4. Fire side effects (audit)
    await this.audit.log({ flagId: flag.id, action: 'CREATE', toState: this.snapshot(result) });

    return result;
  }
}
```

**Method naming follows REST CRUD:** `create`, `findAll`, `findOne`, `update`, `remove`.

**Private helpers:**

- `toFlag()` / `toEntry()` — map Prisma model → shared domain type
- `snapshot()` — capture state for audit log
- `compute*()` — derived field computation
- `extract*()` — parse values from requests
- `resolve*()` — complex business logic

### Pattern 5: DTO Validation

DTOs are **classes** (not interfaces) with `class-validator` decorators:

```typescript
import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsArray } from 'class-validator';

export class CreateFlagDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
```

**ValidationPipe global** (in main.ts):

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

- `whitelist: true` — strips undeclared fields automatically
- `forbidNonWhitelisted: true` — throws on unexpected fields

### Pattern 6: Error Handling

Use NestJS standard exceptions:

| Exception               | When                                       |
| ----------------------- | ------------------------------------------ |
| `NotFoundException`     | Entity not found by ID                     |
| `ConflictException`     | Duplicate name / unique constraint         |
| `UnauthorizedException` | Invalid credentials, missing/invalid token |

Messages should include the value that failed:

```typescript
throw new NotFoundException(`Flag with id "${id}" not found`);
```

**Exception for auth:** use generic messages to prevent user enumeration:

```typescript
throw new UnauthorizedException('Invalid credentials');
```

### Pattern 7: Prisma Usage

- **No abstract repositories** — PrismaService injected directly into services
- PrismaService extends `PrismaClient` (lifecycle via `OnModuleInit`/`OnModuleDestroy`)
- PrismaModule is `@Global()` — available without importing in every module

```typescript
this.prisma.flag.findUnique({ where: { id } });
this.prisma.flag.findMany({ orderBy: { updatedAt: 'desc' } });
this.prisma.flag.create({ data: { name, description, enabled } });
this.prisma.flag.update({ where: { id }, data: dto });
this.prisma.flag.delete({ where: { id } });
```

- Always use a `toFlag()` / `toEntry()` mapper to convert Prisma raw models → shared domain types
- Handle Date → ISO string conversion in the mapper
- Compute derived fields (like `status`) in the mapper, not the DB

### Pattern 8: Auth — JWT + httpOnly Cookie

```typescript
// Guard — extracts token from cookie, validates via AuthService
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['access_token'];
    if (!token) throw new UnauthorizedException('Missing access token');
    const payload = await this.authService.validateToken(token);
    (request as unknown as Record<string, unknown>).user = payload;
    return true;
  }
}
```

- `AuthModule` is `@Global()` so `AuthGuard` is available anywhere
- Auth routes (`/api/auth/login`, `/api/auth/logout`) are NOT guarded
- Evaluation routes (`/api/evaluate`) are NOT guarded (public API)
- Cookie middleware: `app.use(cookieParser())` in `main.ts`

### Pattern 9: Module Registration

```typescript
@Module({
  imports: [PrismaModule, FlagsModule, AuditModule, EvaluationModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- PrismaModule first (base dependency), then feature modules
- Global modules: `PrismaModule` and `AuthModule` (`@Global()`)
- Dependencies flow: `FlagsModule → AuditModule`, `FlagsModule → PrismaService` (via Global)

### Pattern 10: Data Mapper Pattern

Each service has private mapper methods to convert between layers:

```typescript
private toFlag(flag: PrismaFlagModel): Flag {
  return {
    id: flag.id,
    name: flag.name,
    description: flag.description,
    enabled: flag.enabled,
    rolloutPct: flag.rolloutPct,
    whitelist: flag.whitelist,
    status: this.computeStatus(flag.enabled, flag.rolloutPct),  // Computed, not stored
    createdAt: flag.createdAt.toISOString(),
    updatedAt: flag.updatedAt.toISOString(),
  };
}
```

- Converts Prisma model → shared `@fp/shared` type
- Handles Date → ISO string conversion
- Computes derived fields that don't exist in DB
- `snapshot()` variant for audit: returns `Record<string, unknown>` with relevant fields

### Pattern 11: E2E Tests — Testcontainers

```typescript
// jest-e2e.json
// Uses globalSetup (testcontainers.setup.ts) + globalTeardown (testcontainers.teardown.ts)
// Test helper: createTestApp() creates NestApp identical to production

describe('Flags (e2e)', () => {
  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    // Seed admin, login via POST /api/auth/login, store cookie
  });

  afterAll(async () => {
    await cleanDatabase(app); // FK-safe: evaluations > auditLogs > flags > admins
    await app.close();
  });
});
```

- Tests for 401 without cookie (unauthenticated access)
- Full CRUD authenticated with cookie
- `set-cookie` header verification for login/logout
- Clean database with FK-safe ordering

---

## Naming Conventions

| What              | Convention                                | Example                                            |
| ----------------- | ----------------------------------------- | -------------------------------------------------- |
| Modules           | PascalCase + `Module` suffix              | `FlagsModule`, `AuthModule`                        |
| Controllers       | PascalCase + `Controller`                 | `FlagsController`, `AuthController`                |
| Services          | PascalCase + `Service`                    | `FlagsService`, `AuditService`                     |
| Guards            | PascalCase + `Guard`                      | `AuthGuard`                                        |
| DTOs              | {Verb}{Noun}Dto                           | `CreateFlagDto`, `UpdateFlagDto`                   |
| Service methods   | REST verbs                                | `create`, `findAll`, `findOne`, `update`, `remove` |
| Private helpers   | `to`/`compute`/`extract`/`resolve` prefix | `toFlag()`, `computeStatus()`, `extractToken()`    |
| File names        | `{feature}.{role}.ts`                     | `flags.service.ts`, `create-flag.dto.ts`           |
| DB columns        | `snake_case` (via `@map`)                 | `rollout_pct`, `created_at`                        |
| TypeScript fields | `camelCase`                               | `rolloutPct`, `createdAt`                          |

---

## Code Examples

### Full service with mapper pattern

```typescript
@Injectable()
export class FlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(): Promise<Flag[]> {
    const flags = await this.prisma.flag.findMany({ orderBy: { updatedAt: 'desc' } });
    return flags.map((f) => this.toFlag(f));
  }

  async findOne(id: string): Promise<Flag> {
    const flag = await this.prisma.flag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException(`Flag with id "${id}" not found`);
    return this.toFlag(flag);
  }

  async update(id: string, dto: UpdateFlagDto): Promise<Flag> {
    const before = await this.findOne(id);
    const flag = await this.prisma.flag.update({ where: { id }, data: dto });
    const result = this.toFlag(flag);
    const action = dto.enabled !== undefined ? 'TOGGLE' : 'UPDATE';
    await this.audit.log({ flagId: id, action, fromState: this.snapshot(before), toState: this.snapshot(result) });
    return result;
  }

  private toFlag(flag: { ... }): Flag { /* mapper logic */ }
  private snapshot(flag: Flag): Record<string, unknown> { /* state capture */ }
}
```

### Test structure template

```typescript
const mockPrisma = {
  flag: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('FlagsService', () => {
  let service: FlagsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FlagsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(FlagsService);
  });

  describe('create', () => {
    it('creates a flag successfully with valid data (UC-01 happy path)', async () => {
      mockPrisma.flag.findUnique.mockResolvedValue(null);
      mockPrisma.flag.create.mockResolvedValue(prismaFlag);
      const result = await service.create({ name: 'test-flag' });
      expect(result).toMatchObject({ name: 'test-flag', status: 'disabled' });
    });
  });
});
```

---

## Commands

```bash
# Unit tests
pnpm --filter api test

# E2E tests (requires Docker)
pnpm --filter api test:e2e

# Watch mode
pnpm --filter api test:watch

# Coverage
pnpm --filter api test:cov

# Type check
pnpm --filter api typecheck

# Lint
pnpm --filter api lint

# Dev server
pnpm --filter api start:dev

# Prisma commands
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate dev
pnpm --filter api exec prisma studio
```

---

## Resources

- **Prisma schema**: See `apps/api/prisma/schema.prisma`
- **Shared types**: See `packages/shared/src/`
- **Architecture decisions**: See `docs/design.md`
- **API docs**: See `openspec/specs/api/` for API specifications
