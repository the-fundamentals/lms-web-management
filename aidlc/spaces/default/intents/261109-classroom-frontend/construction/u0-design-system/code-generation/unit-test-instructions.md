# Unit Test Instructions: u0-design-system

## Framework

Vitest with jsdom and React Testing Library. Tests live next to the module they cover.

## How to run this unit

```bash
npx vitest run src/components
```

That command is the one to use before the first test run. It covers only `src/components`. It does not run tests from other units.

Layer commands, each scoped to this unit:

```bash
npx vitest run src/components/theme.test.ts
npx vitest run src/components/ui
```

After the test doubles are no longer aliased, the existing shared suite must still pass:

```bash
npx vitest run src/shared
```

## Coverage

Five tests per module, 20 tests in total. No project-wide line-coverage threshold is set. This scope has no 80% floor. Build and Test does not apply one. A unit-scoped run is not a coverage gate.

## Modules and tests

**theme** (`src/components/theme.test.ts`)

- the light background and foreground values are in the stylesheet
- the light primary value is in the stylesheet
- the dark background and foreground values are in the stylesheet
- the dark primary value is in the stylesheet
- the stylesheet names Figtree, Newsreader, and an 8px radius

**button.tsx** (`src/components/ui/button.test.tsx`)

- the control renders as a button
- the button is reachable by keyboard
- the markup uses a semantic color class
- the markup contains no hex color
- the button height is 36px

**alert.tsx** (`src/components/ui/alert.test.tsx`)

- the alert shows its text
- the text is present without relying on color
- the alert uses a semantic color class
- the markup contains no hex color
- the alert does not use a raw gray utility

**skeleton.tsx** (`src/components/ui/skeleton.test.tsx`)

- the skeleton renders
- the skeleton exposes the shadcn slot
- the markup uses a semantic color class
- the markup contains no hex color
- the skeleton is not a button

## Mocks

Do not call the network. Do not call Cognito. Read the stylesheet from disk for the theme tests. Render the components added by the shadcn CLI, not the doubles under `src/shared/ui/test-doubles`.

## Test data

Use the NFR3 hex values already listed in the plan. Do not invent a second palette.
