# JIS — Agent Handout

> **What is this file?** If you're an AI agent (Claude, Gemini, GPT, Copilot, Cursor, or anything else) being asked to work on this project, **read this file first**. It contains everything you need to understand the project, its conventions, and where work currently stands.

---

## 1. Project Overview

**Judiciary Information System (JIS)** — a full-stack web app for managing court cases, hearings, and judicial records. Built for a Software Engineering academic course.

**Who uses it:** Registrars (admins who manage cases), Judges (browse case history), Lawyers (browse case history, charged per view).

**Core flow:** Registrar creates a case → schedules hearings → records adjournments or proceeding summaries → eventually records a judgment and closes the case. Judges and Lawyers can search and view closed cases.

---

## 2. Tech Stack (do NOT change these)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.6+ |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui | latest |
| Icons | lucide-react | latest |
| Database | Supabase Postgres | — |
| Auth | Supabase Auth (email/password) | — |
| ORM | Prisma | 5.x |
| Forms | react-hook-form + zod | latest |
| Testing | Vitest (unit) + Playwright (E2E) | latest |
| Deployment | Vercel + Supabase Cloud | — |

---

## 3. Architecture

**Layered / 3-tier:**

```
Browser (React UI)
  ↓
Next.js Server Actions + Route Handlers (business logic)
  ↓
Prisma ORM (data access)
  ↓
Supabase Postgres (storage) + Supabase Auth (identity)
  ↓
Row-Level Security (defense-in-depth)
```

**Key directories:**

```
app/(auth)/          → login page
app/(dashboard)/     → role-specific dashboards (registrar/, judge/, lawyer/)
actions/             → server actions (business logic) — one file per entity
lib/                 → prisma client, supabase clients, auth helpers, validators
components/ui/       → shadcn components (DO NOT edit these manually)
components/shared/   → project-specific shared components
types/               → shared TypeScript types
prisma/              → schema.prisma
tests/               → unit/ and e2e/
```

---

## 4. Design Rules (STRICTLY ENFORCED)

The app must look like a **professional government records system**, NOT a generic AI-generated SaaS template.

### Color Palette (set in globals.css as CSS custom properties)

- **Primary:** deep slate-navy charcoal
- **Accent:** burnt sienna (ONE warm accent — `oklch(0.50 0.12 55)`)
- **Background:** near-white, barely warm
- **Foreground:** near-black charcoal
- **Destructive:** muted red (not fire-truck)
- **Border radius:** `0.375rem` (6px) — sharp-ish. Never `rounded-3xl` on containers.

### Typography

- **Font:** `Inter` variable via `next/font/google`. Nothing else.
- **Hierarchy through weight/size**, not colored boxes or shadows.
- Headings: `font-semibold` (600). Body: `font-normal` (400).

### What NOT to do

| ❌ Don't | ✅ Do instead |
|---|---|
| Gradient hero banners | Solid backgrounds with whitespace |
| Rounded-3xl containers | `rounded-sm` or `rounded` on cards, sharp tables |
| Emoji as icons (⚖️📋) | lucide-react icons only |
| Rainbow status badges | Same hue family, differentiate by weight/shade |
| Symmetric card grids | Asymmetric layouts — dominant content + sidebar |
| Bouncing loaders | `transition-colors` on hover, shadcn `Skeleton` for loading |
| Placeholder-only forms | Visible `<label>` above every input |
| Bright blue SaaS buttons | Muted primary buttons using the slate palette |
| Airy card-based lists | Dense `Table` rows, monospaced CIN column |

---

## 5. Database Models

Six models + two enums. Full Prisma schema is in `prisma/schema.prisma` (source of truth) and documented in `plan.md` §5.

**Models:** `User`, `Courtroom`, `Case`, `Hearing`, `Judgment`, `CaseView`, `AuditLog`
**Enums:** `Role` (REGISTRAR, JUDGE, LAWYER), `CaseStatus` (REGISTERED, PENDING, ADJOURNED, RESOLVED, CLOSED), `HearingStatus` (SCHEDULED, COMPLETED, ADJOURNED)

**Key relationships:**
- Case → User (judge, prosecutor, lawyer — three FK relations)
- Case → many Hearings
- Case → 0..1 Judgment
- Case → many CaseViews (lawyer billing)
- Hearing → optional Courtroom
- All mutations → AuditLog entry

---

## 6. Roles & Permissions

| Action | Registrar | Judge | Lawyer |
|---|---|---|---|
| Create/delete user accounts | ✅ | ❌ | ❌ |
| Manage courtrooms | ✅ | ❌ | ❌ |
| Register new case | ✅ | ❌ | ❌ |
| Schedule/adjourn hearing | ✅ | ❌ | ❌ |
| Record hearing summary/judgment | ✅ | ❌ | ❌ |
| Query pending/resolved cases | ✅ | ❌ | ❌ |
| Browse closed case (free) | ✅ | ✅ | ❌ |
| Browse closed case (charged) | — | — | ✅ |
| Keyword search | ✅ | ✅ | ✅ |
| View audit logs | ✅ | ❌ | ❌ |

---

## 7. Coding Conventions

### File naming
- Components: `PascalCase.tsx` (e.g. `CaseDetail.tsx`) or `kebab-case.tsx` (e.g. `case-detail.tsx`) — pick one and stay consistent. shadcn defaults to kebab-case, so prefer kebab-case.
- Server actions: `entity.actions.ts` (e.g. `case.actions.ts`)
- Validators: `entity.ts` in `lib/validators/` (e.g. `lib/validators/case.ts`)
- Types: everything in `types/index.ts` or split by entity

### Server actions
- Every action starts with `getCurrentUser()` check — reject if unauthenticated or wrong role.
- Every mutation logs to `AuditLog` via the `logAudit()` helper.
- Return `{ success: true, data }` or `{ success: false, error: string }` — never throw from server actions.
- Validate all inputs with zod before touching the DB.

### Components
- Use shadcn components for all standard UI elements. Don't build custom buttons, inputs, tables, etc.
- Shared project components go in `components/shared/`.
- Page-specific components stay in the route directory or a `_components/` subdirectory.

### Forms
- Always use `react-hook-form` + `zodResolver`.
- Always show field-level validation errors inline, not as toasts.
- Always use visible `<label>` elements — no placeholder-only inputs.

### Data fetching
- Server Components fetch data directly (async component → Prisma query or server action call).
- Client Components use server actions via `useTransition` + form action.
- No `useEffect` + `fetch` patterns — use React Server Components.

---

## 8. Current Progress Tracker

> **Instructions for any agent:** Update the checkboxes below after completing each phase. This is how the next agent knows where to pick up.

- [x] **Phase 0** — Project scaffold & infrastructure
- [x] **Phase 1** — Authentication & role-based routing
- [x] **Phase 2** — Account management (Registrar)
- [x] **Phase 3** — Courtroom management & case registration
- [x] **Phase 4** — Hearing scheduling, adjournment & proceedings
- [x] **Phase 5** — Case resolution & registrar queries
- [ ] **Phase 6** — Judge & Lawyer dashboards, case history & billing
- [ ] **Phase 7** — Audit log viewer & RLS policies
- [ ] **Phase 8** — Testing, polish & deployment

**Last worked on by:** Antigravity - 2026-09-23
**Notes from last session:** Phase 5 complete. Case resolution & statutory judgment recording with immutable case closure, read-only enforcement across closed dockets, pending cases registry sorted by CIN (`/registrar/cases/pending`), resolved cases registry with date-range filtering (`/registrar/cases/resolved`), cases by hearing session date query (`/registrar/cases/by-hearing`), fast CIN search bar, case sub-navigation tabs, and comprehensive Vitest unit tests (25 passing, 100% clean Next.js build). Ready for Phase 6 (Judge & Lawyer dashboards, case history & billing).

---

## 9. Key Reference Files

| File | What it contains |
|---|---|
| `plan.md` | Full project plan: SRS, UML diagrams, schema, permissions, folder structure, testing plan |
| `AGENTS.md` (this file) | Agent handout: context, conventions, progress tracker |
| `docs/phases/phase-N.md` | Detailed prompt for executing Phase N — copy-paste to any agent |
| `prisma/schema.prisma` | Database schema (source of truth for all models) |

---

## 10. Commit Protocol

After each phase is complete, the human will be given **3 commit messages** and will **manually commit**. Agents must NOT auto-commit or run git commands unless explicitly asked. The 3 commit messages for each phase are documented in the phase prompt files (`docs/phases/phase-N.md`).
