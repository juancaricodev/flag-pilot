# Design: 5.4a Atom Components

## Files to Create/Modify

### Shared Package

- `packages/shared/src/flag.ts` — Add `FlagStatus` type + `status` field to `Flag`

### API

- `apps/api/src/flags/application/flags.service.ts` — Compute status in `toFlag()`

### Dashboard — Atoms

- `apps/dashboard/src/components/atoms/Button/Button.tsx`
- `apps/dashboard/src/components/atoms/Button/Button.module.scss`
- `apps/dashboard/src/components/atoms/Button/types.ts`
- `apps/dashboard/src/components/atoms/Button/index.ts`
- `apps/dashboard/src/components/atoms/Button/Button.test.tsx`
- `apps/dashboard/src/components/atoms/Badge/Badge.tsx`
- `apps/dashboard/src/components/atoms/Badge/Badge.module.scss`
- `apps/dashboard/src/components/atoms/Badge/types.ts`
- `apps/dashboard/src/components/atoms/Badge/index.ts`
- `apps/dashboard/src/components/atoms/Badge/Badge.test.tsx`
- `apps/dashboard/src/components/atoms/Input/Input.tsx`
- `apps/dashboard/src/components/atoms/Input/Input.module.scss`
- `apps/dashboard/src/components/atoms/Input/types.ts`
- `apps/dashboard/src/components/atoms/Input/index.ts`
- `apps/dashboard/src/components/atoms/Input/Input.test.tsx`
- `apps/dashboard/src/components/atoms/index.ts`

## Component Design

### Button

```
Props:
  label: string                     ← Required
  variant?: 'primary' | 'secondary' | 'ghost'  ← Default: 'primary'
  onClick?: () => void
  disabled?: boolean                ← Default: false
  type?: 'button' | 'submit'        ← Default: 'button'
  className?: string
  ref? (via forwardRef)

States: default, hover, active, focus-visible, disabled

Tokens: --accent, --accent-hover, --accent-text, --border, --border-hover,
        --text, --text-secondary, --text-muted, --text-disabled,
        --bg, --bg-muted, --radius-md, --radius-lg,
        --space-2, --space-3, --space-4,
        --text-sm, --text-base, --transition-base
```

### Badge

```
Props:
  status?: 'enabled' | 'disabled' | 'partial'  ← Default: 'disabled'

Display mapping:
  enabled  → "Enabled"   → green (--success / --success-light)
  disabled → "Disabled"  → neutral (--bg-muted / --text-muted)
  partial  → "Partial"   → warning (--warning / --warning-light)

Tokens: --success, --success-light, --bg-muted, --text-muted,
        --warning, --warning-light, --text-xs, --space-1, --space-2,
        --space-3, --radius-full, --tracking-wide
```

### Input

```
Props:
  label: string                     ← Required
  name: string                      ← Required
  placeholder?: string
  defaultValue?: string
  error?: string
  disabled?: boolean                ← Default: false
  type?: string                     ← Default: 'text'
  required?: boolean
  ref? (via forwardRef)

States: default, focus, error, disabled

Tokens: --text, --text-secondary, --text-muted, --text-disabled,
        --border, --border-hover, --danger,
        --bg, --bg-muted, --radius-md,
        --space-2, --space-3, --text-sm, --text-base,
        --transition-base, --font-sans
```

## API — Status Computation

In `toFlag()` in FlagsService:

```typescript
type FlagStatus = 'disabled' | 'partial' | 'enabled';

function computeStatus(enabled: boolean, rolloutPct: number): FlagStatus {
  if (!enabled) return 'disabled';
  if (rolloutPct > 0 && rolloutPct < 100) return 'partial';
  return 'enabled';
}
```

## Test Plan

### Button tests

- renders with label text
- calls onClick when clicked
- does NOT call onClick when disabled
- applies primary class by default
- applies secondary class when variant is secondary
- applies ghost class when variant is ghost
- has disabled attribute when disabled
- forwards ref to button element

### Badge tests

- renders "Enabled" for enabled status
- renders "Disabled" for disabled status
- renders "Partial" for partial status
- defaults to disabled when no status provided
- applies correct color class per variant

### Input tests

- renders label text
- renders placeholder text
- shows error message when error prop is set
- uses error styling when error is present
- is disabled when disabled prop is true
- does not show error message when error is undefined
- forwards ref to input element
