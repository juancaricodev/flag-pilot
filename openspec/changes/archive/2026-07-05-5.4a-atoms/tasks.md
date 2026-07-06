## Tasks: 5.4a Atom Components

### T-001: Add FlagStatus type to shared package

- [x] Add `FlagStatus = 'disabled' | 'partial' | 'enabled'` type
- [x] Add `status: FlagStatus` to the `Flag` interface
- [x] File: `packages/shared/src/flag.ts`

### T-002: Compute status in FlagsService

- [x] Add `computeStatus()` helper in `toFlag()`
- [x] Return `status` field alongside existing fields
- [x] File: `apps/api/src/flags/application/flags.service.ts`

### T-003: Create Button atom

- [x] Button.tsx with forwardRef, variants, states
- [x] Button.module.scss with tokens
- [x] types.ts with ButtonProps
- [x] index.ts re-export
- [x] Button.test.tsx with all scenarios
- [x] Location: `apps/dashboard/src/components/atoms/Button/`

### T-004: Create Badge atom

- [x] Badge.tsx with status variants
- [x] Badge.module.scss with tokens
- [x] types.ts with BadgeProps
- [x] index.ts re-export
- [x] Badge.test.tsx with all scenarios
- [x] Location: `apps/dashboard/src/components/atoms/Badge/`

### T-005: Create Input atom

- [x] Input.tsx with forwardRef, states
- [x] Input.module.scss with tokens
- [x] types.ts with InputProps
- [x] index.ts re-export
- [x] Input.test.tsx with all scenarios
- [x] Location: `apps/dashboard/src/components/atoms/Input/`

### T-006: Create atoms barrel index

- [x] Re-export all 3 atoms
- [x] File: `apps/dashboard/src/components/atoms/index.ts`
