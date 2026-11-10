# Code Generation Plan: u0-design-system

## Summary

- Builds: the Vite app, Tailwind, and the shadcn controls styled with the light and dark palette
- Touches: the Vite and Tailwind setup, `src/components/ui/`, and the global stylesheet
- Tests: 20 unit tests, 5 per module, under `src/components/`

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:7eda6dbebc7eba01e8858d8911833c06e2bca18cdf76aeaf6f15de08f0d63baa",
  "contract_sha256": "sha256:aee7bb02f8205912a3ecda3439fd589eea1b0cfac342d3618186cb636cbed02a"
}
```

## What this unit is

`u0-design-system` is the Vite React app, Tailwind CSS, and shadcn/ui. It has no dependencies. Route units and the shared library import it. It imports none of them.

There is no functional design, NFR design, or infrastructure design. The work comes from `unit-of-work.md`, the U0 rows in `unit-of-work-story-map.md`, and `requirements.md` NFR3, NFR6, and NFR7.

No database, no repository, and no API. Those layers are omitted. This unit does not add routes, a sidebar, or a sign-in screen.

Colors live as CSS variables in the global stylesheet. Screens use semantic names. They do not use one-off hex values or raw gray utilities. Stacks use gap. Dark mode uses the same names under the dark set. There is no theme switcher in this unit.

## Steps

Test-after. Each layer is implemented, then its tests are written and run, before the next layer.

### Step 1. Project structure

- [ ] Run `npx shadcn@latest init --template vite` in this project. Use CSS variables, TypeScript, and `src/components/ui`. Do not pass a preset. Do not add a community registry.
- [ ] Keep one Vite app. Do not add a second bundler or a second app folder.
- [ ] After init, keep `typescript` at `6.0.3`, the `generate:api` script, and the packages already in `package.json`.
- [ ] Add `@fontsource/figtree` and `@fontsource/newsreader`. No font CDN and no secret.
- [ ] Leave `src/routes/` and the signed-in layout to the app unit. If the template writes `src/main.tsx`, keep it only as the Vite entry. Do not put screens in it.
- [ ] Point the `@/` alias at `src/` in Vite and in Vitest.
- [ ] Remove the Vitest aliases that send `@/components/ui/skeleton`, `alert`, and `button` to `src/shared/ui/test-doubles`. Those doubles were only for the shared unit before this folder existed.

Stories: NFR6, NFR7.

### Step 2. Test runner

- [ ] Vitest, jsdom, and React Testing Library are already installed. Do not add a second runner.
- [ ] Keep `include` as `src/**/*.test.ts` and `src/**/*.test.tsx`.
- [ ] This unit's command is `npx vitest run src/components`.
- [ ] Do not set a coverage threshold. This scope has no line-coverage floor.
- [ ] After the aliases in Step 1 are removed, `npx vitest run src/shared` still passes.

Stories: none.

### Step 3. Tokens, then their tests

Implement, then write and run 5 tests.

- [ ] Write the NFR3 light and dark values as CSS variables on the semantic names in the global stylesheet the CLI creates.
- [ ] Light: background `#F6F1E7`, foreground `#1F1A14`, card `#FFFCF6`, primary `#0E6B62`, primary foreground `#F6F1E7`, secondary `#E6DDD0`, muted `#EFE8DC`, muted foreground `#5E574E`, accent `#E7D7A8`, destructive `#8E2F2F`, border `#D8CFC2`, ring `#0E6B62`. Card, secondary, muted, accent, and destructive foregrounds are `#1F1A14` except destructive foreground `#F6F1E7`.
- [ ] Dark: background `#1A1714`, foreground `#F6F1E7`, card `#24201C`, primary `#3DADA3`, primary foreground `#1A1714`, secondary `#3A342C`, muted `#2C2824`, muted foreground `#C4B8A8`, accent `#C4A86A`, destructive `#E07A7A`, border `#3A342C`, ring `#3DADA3`. Card and secondary foregrounds are `#F6F1E7`. Accent and destructive foregrounds are `#1A1714`.
- [ ] Radius `8px`. UI font Figtree. Page titles Newsreader. Type classes: page 24px semibold, section 18px semibold, body 16px, secondary 14px.
- [ ] Spacing steps for screens: 8px, 16px, 24px, 32px. Document them as the gap and padding steps. Do not restyle shadcn internals with a second scale.
- [ ] Five tests in `src/components/theme.test.ts`. They read the stylesheet. Run `npx vitest run src/components/theme.test.ts`.

Stories: NFR3, NFR6.

### Step 4. Controls, then their tests

- [ ] Add only `button`, `alert`, and `skeleton` with `npx shadcn@latest add button alert skeleton`.
- [ ] Set the default button height to 36px. Do not add a hex color, a raw gray class, or a `space-y` class.
- [ ] Five tests each in `button.test.tsx`, `alert.test.tsx`, and `skeleton.test.tsx` under `src/components/ui/`. Each test renders the real component, checks a semantic class, and checks that the markup has no hex color.
- [ ] Run `npx vitest run src/components`.

Stories: NFR2, NFR3, NFR6.

### Step 5. Traceability

- [ ] Write `traceability.json` for this unit after the code exists. NFR3, NFR6, and NFR7 point at the stylesheet, the components, and the Vite config.
- [ ] Write `code-summary.md`.

## Requirement map

| Requirement | Step |
|---|---|
| NFR2 | Step 4. Controls are keyboard reachable and status is not color alone. The shared screens already show text. |
| NFR3 | Steps 3 and 4 |
| NFR6 | Steps 1, 3, and 4 |
| NFR7 | Step 1 |
| NFR1 | Not this unit. Later screens keep the 1280px width. |
