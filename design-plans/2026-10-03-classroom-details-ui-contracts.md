---
title: Classroom details — audited UI contract fixes
status: done
surface: /dashboard/classrooms/$classroomId (+ breadcrumbs)
commit: 25a95f746bfb3209c84dc7f4d687c186d8065712
finding: 1 + 2 + 3
---

# Classroom details — audited UI contract fixes

## Goal

Classroom details matches documented typography, IA breadcrumb naming, and color wash rules.

## Evidence

See audit findings 1–3 (dual `heading-xl`, breadcrumb `Teaching` vs `Classrooms`, undocumented banner gradient).

## Implementation (applied)

1. [`src/features/classrooms/pages/classroom-people-page.tsx`](../src/features/classrooms/pages/classroom-people-page.tsx) — removed People `h1` / `heading-xl`; kept help + counts.
2. [`src/components/layout/dashboard-breadcrumbs.tsx`](../src/components/layout/dashboard-breadcrumbs.tsx) — mid-crumb `Classrooms` → `/dashboard/classrooms/list`; list path collapses to `Dashboard / Classrooms` (no duplicate).
3. [`src/features/classrooms/pages/classroom-details-page.tsx`](../src/features/classrooms/pages/classroom-details-page.tsx) — removed banner `bg-gradient-to-t` overlay.

## Verification

- [ ] People tab: only classroom name uses `text-2xl font-semibold tracking-tight`.
- [ ] Detail breadcrumb: `Dashboard / Classrooms / {name}` with Classrooms linking to list.
- [ ] List breadcrumb: `Dashboard / Classrooms` (single Classrooms crumb).
- [ ] No `bg-gradient-to-t` on classroom details banner.
