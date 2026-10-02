## Navigation and IA

IA **principles**: `.cursor/rules/core/design-core.mdc`. **Implementation**: `.cursor/rules/frontend/ia-navigation-and-structure.mdc`. Chrome: `src/components/layout/app-sidebar.tsx`.

- **Product**: LMS Web Management (staff / teacher console for The Fundamentals).
- **Shell**: collapsible sidebar + breadcrumbs (`DashboardBreadcrumbs`). Classroom detail adds local tabs.

### Sitemap

**Auth / entry**

- `/` – Sign in
- `/callback` – OIDC return
- `/onboarding` – First-time profile setup

**App (sidebar)**

- `Dashboard` → `/dashboard` – Overview
- **Teaching**
  - `Classrooms` → `/dashboard/classrooms/list` – Classroom list / create
- Routes present but not yet primary nav (keep labels consistent if promoted):
  - `Courses` → `/dashboard/courses`
  - `Users` → `/dashboard/users`
  - `Settings` → `/dashboard/settings`

**Classroom detail** (`/dashboard/classrooms/$classroomId`)

Tabs (noun labels, stable order):

1. `Overview`
2. `People`
3. `Schedule`
4. `Finances`

Breadcrumb pattern: `Dashboard / Classrooms / {Classroom name} [/ Tab]`.

### Guidelines

- Noun-based labels in present tense (`Classrooms`, not `Manage classrooms`).
- Depth ≤ ~3 levels (sidebar → list → detail tab).
- Same concept → same word in nav, headings, buttons, and empty states.
- Primary create actions stay near the list they affect (e.g. new classroom on classrooms list).
