# Spec: 5.4a Atom Components

## Domain: Dashboard UI — Atoms

### Requirement: Badge component

The system MUST provide a Badge atom that displays a flag's computed status as a colored label.

**Scenario: Happy path — enabled status**

- GIVEN the status is `"enabled"`
- WHEN the Badge is rendered
- THEN it MUST display the text "Enabled"
- AND it MUST use a green color scheme (`--success` / `--success-light`)

**Scenario: Happy path — disabled status**

- GIVEN the status is `"disabled"`
- WHEN the Badge is rendered
- THEN it MUST display the text "Disabled"
- AND it MUST use a neutral color scheme (`--bg-muted` / `--text-muted`)

**Scenario: Happy path — partial status**

- GIVEN the status is `"partial"`
- WHEN the Badge is rendered
- THEN it MUST display the text "Partial"
- AND it MUST use a warning color scheme (`--warning` / `--warning-light`)

**Scenario: Default variant**

- GIVEN no status is provided
- WHEN the Badge is rendered
- THEN it MUST default to "disabled" variant

### Requirement: Button component

The system MUST provide a Button atom with multiple variants for forms, sidebar, and actions.

**Scenario: Primary variant**

- GIVEN the variant is `"primary"` (default)
- WHEN the Button is rendered
- THEN it MUST display the `label` text
- AND it MUST use accent background (`--accent`) with white text (`--accent-text`)
- AND clicking it MUST call the `onClick` handler

**Scenario: Secondary variant**

- GIVEN the variant is `"secondary"`
- WHEN the Button is rendered
- THEN it MUST have a transparent background with border (`--border`)
- AND it MUST use the default text color (`--text`)

**Scenario: Ghost variant**

- GIVEN the variant is `"ghost"`
- WHEN the Button is rendered
- THEN it MUST have no background and no border
- AND it MUST use secondary text color (`--text-secondary`)

**Scenario: Disabled state**

- GIVEN the Button is rendered with `disabled={true}`
- THEN it MUST NOT respond to clicks
- AND it MUST use muted colors (`--text-disabled`)
- AND cursor MUST be `not-allowed`

**Scenario: Focus visible**

- WHEN the Button is focused via keyboard
- THEN it MUST show a visible focus ring (`--accent`)

### Requirement: Input component

The system MUST provide an Input atom for text fields in forms.

**Scenario: Default state**

- GIVEN the Input is rendered with a `label`
- WHEN no value is entered
- THEN it MUST display the label above the input field
- AND it MUST show the `placeholder` text inside the input

**Scenario: Error state**

- GIVEN the Input is rendered with `error="Error message"`
- THEN it MUST display the error message below the input
- AND it MUST use danger colors (`--danger`) for border and text

**Scenario: Disabled state**

- GIVEN the Input is rendered with `disabled={true}`
- THEN it MUST NOT be editable
- AND it MUST use muted styling

**Scenario: Forward ref**

- WHEN the Input is used in a form
- THEN it MUST forward the ref to the underlying `<input>` element for form libraries

### Requirement: Flag type — status field (API + shared)

The system MUST compute and return a `status` field on the Flag type.

**Scenario: Disabled status computation**

- GIVEN a flag has `enabled: false`
- WHEN `toFlag()` is called
- THEN `status` MUST be `"disabled"`

**Scenario: Partial status computation**

- GIVEN a flag has `enabled: true` AND `rolloutPct` is between 1 and 99 inclusive
- WHEN `toFlag()` is called
- THEN `status` MUST be `"partial"`

**Scenario: Enabled status computation**

- GIVEN a flag has `enabled: true` AND `rolloutPct` is exactly 0 or exactly 100
- WHEN `toFlag()` is called
- THEN `status` MUST be `"enabled"`
