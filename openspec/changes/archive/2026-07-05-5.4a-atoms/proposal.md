# Proposal: 5.4a Atom Components — Button, Badge, Input (revised)

## Intent

Create 3 foundational atom components for Flag Pilot: Button, Badge, and Input. Plus add `status` field to the shared Flag type (computed by API). Pure presentational components with CSS Modules + SCSS, co-located types, and component tests.

## Scope

### In scope

- **API + shared**: Add `FlagStatus` type and `status` field to `Flag` interface in `@fp/shared`. Compute status in `toFlag()` in `FlagsService`.
- **Button**: variants (primary, secondary, ghost), states (hover, active, disabled, focus), forwardRef for form integration
- **Badge**: variants (enabled, disabled, partial), matches flag status values
- **Input**: text input with label, placeholder, error state, disabled state, forwardRef
- Each with CSS Modules, types, tests

### NOT in scope

- StatusDot (no consumer yet)
- Sidebar navigation (separate change)
- Layout update (separate change)
- Toggle switch (Task 5.6, separate change)

## Approach

- 3 atoms in `src/components/atoms/`
- Follow established pattern: ComponentName.tsx + .module.scss + types.ts + index.ts + .test.tsx
- Use existing design tokens from \_tokens.scss
- No new tokens needed
- Status computed in API, passed as prop to atoms

## Risks

- None — atoms are low risk, pure presentational
- Shared Flag type change affects both apps (API + Dashboard)
