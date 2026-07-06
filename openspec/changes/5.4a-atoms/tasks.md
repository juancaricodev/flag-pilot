## Tasks: 5.4a Atom Components

### T-001: Add FlagStatus type to shared package

- Add `FlagStatus = 'disabled' | 'partial' | 'enabled'` type
- Add `status: FlagStatus` to the `Flag` interface
- File: `packages/shared/src/flag.ts`

### T-002: Compute status in FlagsService

- Add `computeStatus()` helper in `toFlag()`
- Return `status` field alongside existing fields
- File: `apps/api/src/flags/application/flags.service.ts`

### T-003: Create Button atom

- Button.tsx with forwardRef, variants, states
- Button.module.scss with tokens
- types.ts with ButtonProps
- index.ts re-export
- Button.test.tsx with all scenarios
- Location: `apps/dashboard/src/components/atoms/Button/`

### T-004: Create Badge atom

- Badge.tsx with status variants
- Badge.module.scss with tokens
- types.ts with BadgeProps
- index.ts re-export
- Badge.test.tsx with all scenarios
- Location: `apps/dashboard/src/components/atoms/Badge/`

### T-005: Create Input atom

- Input.tsx with forwardRef, states
- Input.module.scss with tokens
- types.ts with InputProps
- index.ts re-export
- Input.test.tsx with all scenarios
- Location: `apps/dashboard/src/components/atoms/Input/`

### T-006: Create atoms barrel index

- Re-export all 3 atoms
- File: `apps/dashboard/src/components/atoms/index.ts`
