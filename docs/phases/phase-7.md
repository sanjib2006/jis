# Phase 7 — Audit Log Viewer & RLS Policies

> **Context:** Read `AGENTS.md` first. Phases 0–6 must be complete. All features are functionally working. This phase hardens security.

## What you are building

Registrar-only audit log viewer page. Supabase Row-Level Security policies. Role guards on every server action (audit pass to confirm). Error boundary pages.

## Functional Requirements covered

- **FR21:** All mutations stored as immutable, timestamped history.
- **NFR1:** Role-based access enforced at DB level (RLS).
- **NFR7:** Every billable view and account operation logged.

## Tasks

### 7.1 — Audit log server action
- **File:** `actions/audit.actions.ts` (add to existing)

**`getAuditLogs(filters?)`:**
1. Role check (REGISTRAR)
2. Optional filters: `action` (string), `entity` (string), `actorId` (string), `fromDate` (date), `toDate` (date)
3. Paginated: accept `page` and `pageSize` (default 50)
4. Return rows with actor name included (join User)
5. Sorted by `createdAt desc`

### 7.2 — Audit log viewer page
- **File:** `app/(dashboard)/registrar/audit/page.tsx`
- Filter bar at top: Action type dropdown (all the action constants), Entity dropdown, Date range, Actor (user) dropdown
- Dense table: Timestamp (monospaced, `font-mono text-xs`), Actor, Action, Entity, Entity ID, Details (truncated, expandable)
- Pagination at bottom
- Read-only — no edit/delete actions anywhere

### 7.3 — RLS policies
- **File:** `supabase/rls-policies.sql` (or run via Supabase SQL Editor — document the SQL here)

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Courtroom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Case" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hearing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Judgment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CaseView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (the app uses service role key)
-- For direct DB access testing, define per-role policies:

-- AuditLog: INSERT only for authenticated, SELECT only for registrars
-- CaseView: INSERT for lawyers only, SELECT for the owning lawyer
-- Case/Hearing/Judgment: full access for registrars, SELECT (closed only) for judge/lawyer
```

> **Note:** Since the app uses the Supabase service role key (which bypasses RLS), these policies primarily serve as defense-in-depth for any direct DB access. The primary authorization layer is the role checks in server actions.

### 7.4 — Role guard audit
- **Review and update:** ALL files in `actions/*.actions.ts`
- Every single exported function must start with:
  ```typescript
  const user = await getCurrentUser();
  if (!user || user.role !== 'REQUIRED_ROLE') {
    return { success: false, error: 'Unauthorized' };
  }
  ```
- Create a helper if it doesn't exist: `requireRole(role: Role)` that throws or returns user
- Verify every action has this guard — no exceptions

### 7.5 — Error boundary pages
- **File:** `app/(dashboard)/error.tsx` — generic error page (Server error boundary)
- **File:** `app/(dashboard)/not-found.tsx` — 404 page for invalid routes
- **File:** `app/(auth)/error.tsx` — auth error page
- Keep these simple: a message, a "Go back" button. No illustration. No emoji.

### 7.6 — Middleware hardening
- **Update:** `middleware.ts`
- Ensure ALL sub-routes are protected, not just the root dashboard routes
- e.g. `/registrar/accounts` must require REGISTRAR role, not just a valid session
- Test: Judge visiting `/registrar/accounts` → redirected to `/judge`

## Design notes

- **Audit log page:** The densest page in the app. Small font. Monospaced timestamps. Muted text for less important columns (entity ID, details). This should feel like reading a server log, not browsing a pretty dashboard.
- **Error pages:** Clean, centered text. "Something went wrong" or "Page not found." A single "Go back to dashboard" link. No stock illustrations.

## How to verify

- View audit log as Registrar — should show all past actions (user created, case created, hearings, etc.)
- Filter by "CASE_CREATED" → only case creation events
- Filter by date range → correct subset
- Try accessing `/registrar/audit` as Judge → redirected
- Try calling `createUser` server action with a Judge's session → returns `{ success: false, error: 'Unauthorized' }`
- Visit `/registrar/nonexistent` → 404 page renders
- **TC9:** Verify AuditLog is append-only (if RLS is active for non-service-role connections)

## Commit messages

```
1. feat(audit): add audit log viewer page with filtering and pagination
2. security: define supabase RLS policies and add role guards to all server actions
3. feat: add error boundaries and unauthorized access handling
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 7.
