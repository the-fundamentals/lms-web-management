# Plan template (improve-ui)

Write one file per selected finding under `design-plans/`. Name: `YYYY-MM-DD-<short-slug>.md`.

The executor has **no** audit or chat context. Every plan must be self-contained.

```markdown
---
title: <one-line change>
status: ready
surface: <route or layout family>
commit: <git SHA or unknown>
finding: <audit finding number or title>
---

# <title>

## Goal

One sentence: the interface consequence after the change.

## Evidence

- **Contract:** cited design rule / doc path + exact requirement.
- **Runtime:** file path(s), symbol(s), and how the wrong value reaches the UI.
- **Correction:** the single change required (no alternatives).

## Out of scope

List nearby temptations the executor must not expand into.

## Implementation

Numbered steps with exact file paths and what to edit.

Reuse named primitives / tokens / exemplars (cite paths). Do not invent values when the repo already defines them.

## Docs follow-ups (executor only)

If design docs must change to stay true after the fix, list the edits here. Do not edit docs during the audit skill run.

## Verification

Checklist the executor can run (visual and/or grep) to confirm the contract is met.
```
