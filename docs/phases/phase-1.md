# Phase 1 — Authentication & Role-Based Routing

> **Context:** Read `AGENTS.md` first. Phase 0 must be complete (check `AGENTS.md` §8). The app should already boot with placeholder pages.

## What you are building

Login with Supabase Auth, role-based redirect after login, middleware that blocks unauthorized route access, and the dashboard shell (sidebar + topbar) that all role dashboards share.

## Functional Requirements covered

- **FR3:** System must authenticate users and restrict features by role (Registrar / Judge / Lawyer).

## Tasks

### 1.1 — Login page
- **File:** `app/(auth)/login/page.tsx`
- Email + password form using `react-hook-form` + `zod`
- No "sign up" link — accounts are created by Registrar only
- Clean, centered card layout. No gradient background. Just a form on a near-white page with the app title above it.
- Validation schema: `lib/validators/auth.ts` — email required, password min 6 chars

### 1.2 — Login server action
- **File:** `actions/auth.actions.ts`
- `signIn(email, password)`:
  1. Call Supabase `signInWithPassword`
  2. On success, query Prisma for User row by email
  3. Check `isActive === true` — reject if deactivated
  4. Read `role` field
  5. Redirect to `/(dashboard)/registrar`, `/(dashboard)/judge`, or `/(dashboard)/lawyer`
- Return `{ success: false, error: "..." }` on any failure (wrong credentials, deactivated, no user row)

### 1.3 — Logout server action
- **File:** `actions/auth.actions.ts`
- `signOut()`: call Supabase `signOut()`, redirect to `/login`

### 1.4 — Auth middleware
- **File:** `middleware.ts`
- Runs on all `/(dashboard)` routes
- No session cookie → redirect to `/login`
- Session exists but user accesses wrong role's route (e.g. Judge visits `/registrar/...`) → redirect to their correct dashboard root
- `/login` with valid session → redirect to their dashboard (no re-login needed)

### 1.5 — `getCurrentUser()` helper
- **File:** `lib/auth.ts`
- Reads Supabase session server-side → fetches User row from Prisma → returns typed `User` or `null`
- This will be called at the top of every server action in later phases

### 1.6 — Dashboard layout with sidebar
- **File:** `app/(dashboard)/layout.tsx`
- Desktop: fixed left sidebar (220px) + main content area
- Mobile: sidebar hidden, hamburger button opens `Sheet` (shadcn)
- Sidebar content driven by role (different nav links for each role)
- **File:** `components/shared/sidebar.tsx`
- **File:** `components/shared/topbar.tsx` — shows user name, role badge (muted style), logout button

### 1.7 — Nav config
- **File:** `lib/nav-config.ts`
- Three arrays of `{ label, href, icon }` for Registrar, Judge, Lawyer
- Registrar: Cases, Hearings, Courtrooms, Accounts, Audit Log
- Judge: Case History
- Lawyer: Case History, Billing

### 1.8 — Seed script
- **File:** `prisma/seed.ts`
- Creates one Registrar user in Supabase Auth (email: `registrar@jis.local`, password from env or hardcoded for dev)
- Creates matching User row in Prisma with `role: REGISTRAR`
- Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `package.json`
- Install `tsx` as dev dependency

## Design notes

- **Login page:** No hero image, no illustration. White/near-white background. Centered card with `max-w-sm`. App title "Judiciary Information System" in `text-lg font-semibold` above the card. Form inputs with visible labels.
- **Sidebar:** `bg-primary text-primary-foreground`. Nav links with `hover:bg-accent` state. Active link indicated by left border accent, not full background change.
- **Topbar:** Minimal — user info right-aligned. No breadcrumbs yet. `border-b` bottom border only.

## How to verify

- Log in with the seeded Registrar → lands on `/registrar`
- Try navigating to `/judge` → redirected to `/registrar`
- Log out → lands on `/login`
- Visit `/registrar` without session → redirected to `/login`
- Sidebar shows Registrar-specific nav links
- Mobile: sidebar collapses to hamburger

## Commit messages

```
1. feat(auth): implement login page, supabase auth, and role-based redirect
2. feat(layout): add dashboard shell with role-aware sidebar and topbar
3. chore: add auth middleware, getCurrentUser helper, and registrar seed script
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 1.
