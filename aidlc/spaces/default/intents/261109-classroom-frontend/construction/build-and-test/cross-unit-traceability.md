# Cross-Unit Traceability

**Verdict:** PASS

**Uncovered:** None.

| ID | Covered | Owning stage/Unit · target |
|---|---|---|
| FR1.1 | yes | u2-auth: src/features/auth/lib/profile-gate.ts; u3-classroom: src/routes/index.tsx |
| FR1.2 | yes | u2-auth: src/features/auth/components/name-form.tsx; u3-classroom: src/routes/index.tsx |
| FR1.3 | yes | u2-auth: src/features/auth/components/sign-out.tsx; u8-app: src/features/app-shell/components/nav-user.tsx |
| FR1.4 | yes | u2-auth: src/features/auth/lib/profile-gate.ts |
| FR1.5 | yes | u2-auth: src/features/auth/lib/profile-gate.ts |
| FR2.1 | yes | u3-classroom: src/routes/classrooms/index.tsx; u8-app: src/features/app-shell/components/app-sidebar.tsx |
| FR2.2 | yes | u3-classroom: src/features/classroom/components/classroom-list.tsx |
| FR2.3 | yes | u3-classroom: src/features/classroom/components/classroom-create.tsx |
| FR2.4 | yes | u3-classroom: src/features/classroom/lib/classroom-name.ts |
| FR2.5 | yes | u3-classroom: src/features/classroom/components/classroom-layout.tsx; u5-schedule: src/features/schedule/components/session-overview.tsx |
| FR2.6 | yes | u3-classroom: src/features/classroom/components/classroom-rename.tsx |
| FR3.1 | yes | u4-members: src/features/members/components/member-list.tsx |
| FR3.2 | yes | u4-members: src/features/members/components/member-add.tsx |
| FR3.3 | yes | u4-members: src/features/members/lib/member-api.ts |
| FR3.4 | yes | u4-members: src/features/members/components/member-remove-dialog.tsx |
| FR3.5 | yes | u4-members: src/features/members/components/member-attendance.tsx |
| FR4.1 | yes | u5-schedule: src/features/schedule/components/session-overview.tsx |
| FR4.2 | yes | u5-schedule: src/features/schedule/components/session-calendar.tsx |
| FR4.3 | yes | u5-schedule: src/features/schedule/components/weekly-schedule.tsx |
| FR4.4 | yes | u5-schedule: src/features/schedule/components/weekly-schedule.tsx |
| FR4.5 | yes | u5-schedule: src/features/schedule/components/session-create.tsx |
| FR4.6 | yes | u5-schedule: src/features/schedule/components/session-attendance.tsx |
| FR4.7 | yes | u5-schedule: src/features/schedule/components/session-attendance.tsx |
| FR4.8 | yes | u5-schedule: src/features/schedule/components/session-attendance.tsx |
| FR4.9 | yes | u5-schedule: src/features/schedule/components/session-attendance.tsx |
| FR5.1 | yes | u6-payment: src/features/payment/lib/vnd.ts |
| FR5.2 | yes | u6-payment: src/features/payment/components/money-pricing.tsx |
| FR5.3 | yes | u6-payment: src/features/payment/components/money-pricing.tsx |
| FR5.4 | yes | u6-payment: src/features/payment/lib/payment-api.ts |
| FR5.5 | yes | u6-payment: src/features/payment/components/invoice-list.tsx |
| FR5.6 | yes | u6-payment: src/features/payment/components/invoice-create.tsx |
| FR5.7 | yes | u6-payment: src/features/payment/components/invoice-detail.tsx |
| FR5.8 | yes | u6-payment: src/features/payment/components/invoice-list.tsx |
| FR6.1 | yes | u1-shared: src/shared/lib/gmt7.ts; u5-schedule: src/features/schedule/lib/session-time.ts |
| FR6.2 | yes | u1-shared: src/shared/lib/gmt7.ts; u5-schedule: src/features/schedule/lib/session-time.ts |
| FR7.1 | yes | u0-design-system: src/components/ui/skeleton.tsx; u1-shared: src/shared/ui/loading-screen.tsx; u2-auth: src/features/auth/components/sign-in-screen.tsx; u6-payment: src/features/payment/components/invoice-list.tsx; u8-app: src/features/app-shell/components/app-shell.tsx |
| FR7.2 | yes | u1-shared: src/shared/api/client.ts |
| FR7.3 | yes | u1-shared: src/shared/lib/screen-rules.ts; u2-auth: src/features/auth/components/name-form.tsx; u3-classroom: src/features/classroom/lib/classroom-name.ts; u4-members: src/features/members/components/member-add.tsx; u5-schedule: src/features/schedule/components/session-create.tsx; u6-payment: src/features/payment/components/invoice-create.tsx |
| FR7.4 | yes | u2-auth: src/features/auth/components/name-form.tsx; u3-classroom: src/features/classroom/components/classroom-create.tsx; u4-members: src/features/members/components/member-add.tsx; u5-schedule: src/features/schedule/components/weekly-schedule.tsx; u6-payment: src/features/payment/components/invoice-create.tsx |
| FR7.5 | yes | u1-shared: src/shared/lib/screen-rules.ts |
| FR8.1 | yes | N/A — u7-tools/code-generation: Tools cancelled — no account-menu Tools entry in this intent; u8-app/code-generation: Tools account-menu entry not in this intent (U7 cancelled) |
| FR8.2 | yes | N/A — u7-tools/code-generation: Generate sessions from weekly recurrence not built in this intent |
| FR8.3 | yes | u6-payment: src/features/payment/components/invoice-list.tsx; u7-tools: aidlc/spaces/default/intents/261109-classroom-frontend/construction/u7-tools/code-generation/code-summary.md |
| FR8.4 | yes | u2-auth: src/features/auth/lib/profile.ts; u3-classroom: src/features/classroom/lib/classroom-api.ts; u4-members: src/features/members/lib/member-api.ts; u5-schedule: src/features/schedule/lib/session-api.ts; u6-payment: src/features/payment/lib/payment-api.ts |
| NFR1 | yes | u8-app: src/features/app-shell/components/app-shell.tsx |
| NFR2 | yes | u0-design-system: src/components/ui/button.tsx; u1-shared: src/shared/ui/error-screen.tsx; u2-auth: src/features/auth/components/name-form.tsx; u3-classroom: src/features/app-shell/components/app-shell.tsx; u4-members: src/features/members/components/member-list.tsx; u5-schedule: src/features/schedule/components/session-overview.tsx; u6-payment: src/features/payment/components/money-pricing.tsx; u8-app: src/features/app-shell/components/app-shell.tsx |
| NFR3 | yes | u0-design-system: src/index.css; u2-auth: src/features/auth/components/sign-in-screen.tsx; u3-classroom: src/features/app-shell/components/app-shell.tsx; u4-members: src/components/ui/alert-dialog.tsx; u5-schedule: eslint.config.js |
| NFR4 | yes | u1-shared: src/shared/api/client.ts; u2-auth: src/features/auth/lib/session.ts |
| NFR5 | yes | u1-shared: src/shared/lib/text.ts; u2-auth: src/features/auth/components/name-form.tsx; u3-classroom: src/features/classroom/components/classroom-layout.tsx |
