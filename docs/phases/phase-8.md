# Phase 8 — Testing, Polish & Deployment

> **Context:** Read `AGENTS.md` first. Phases 0–7 must be complete. All features are built and security is hardened. This phase is about quality.

## What you are building

Comprehensive test suite (unit + E2E), responsive design pass, loading/empty states, final visual audit against the anti-AI-slop rules, README, and production deployment.

## Tasks

### 8.1 — Vitest setup and unit tests
- **Install:** `vitest`, `@testing-library/react` (if needed for component tests)
- **Config:** `vitest.config.ts` with path aliases matching `tsconfig.json`
- **File:** `tests/unit/case.actions.test.ts`
  - `registerCase` creates case with unique CIN
  - `registerCase` rejects if judgeId is not a JUDGE
  - `registerCase` rejects missing required fields
  - `recordJudgment` rejects if case already has judgment
  - `recordJudgment` rejects if case status is REGISTERED (no hearings yet)
  - `getPendingCases` excludes CLOSED cases
  - `getResolvedCases` filters by date range correctly
  - `searchCases("theft")` returns matching cases
- **File:** `tests/unit/hearing.actions.test.ts`
  - `getAvailableSlots` returns correct count with partial bookings
  - `getAvailableSlots` returns empty when courtroom at maxSlots
  - `scheduleHearing` rejects if judge already booked
  - `recordAdjournment` rejects without reason (empty string)
  - Adjournment updates case status to ADJOURNED
- **File:** `tests/unit/user.actions.test.ts`
  - `createUser` rejects non-REGISTRAR callers
  - `createUser` rejects duplicate email
  - `deactivateUser` sets isActive false
  - `deactivateUser` creates AuditLog entry
- **File:** `tests/unit/caseView.actions.test.ts`
  - `viewCaseAsLawyer` creates CaseView row with charge
  - `viewCaseAsLawyer` called twice creates two rows
  - `viewCaseAsJudge` does NOT create CaseView row
  - `getLawyerBilling` returns correct total

> **Note:** For unit tests that need DB access, mock Prisma with `vitest.mock()` or use a test database. Decide based on what's practical.

### 8.2 — Playwright E2E setup and tests
- **Install:** `@playwright/test`
- **Config:** `playwright.config.ts`
- **File:** `tests/e2e/case-lifecycle.spec.ts`
  - Full flow: login as Registrar → register case → schedule hearing → record adjournment → reschedule → record summary → record judgment → verify case is closed → verify read-only
- **File:** `tests/e2e/lawyer-billing.spec.ts`
  - Login as Lawyer → browse history → view a case → confirm charge → check billing page → view same case again → billing shows two entries
- **File:** `tests/e2e/account-management.spec.ts`
  - Login as Registrar → create Judge account → log out → log in as new Judge → works → log out → deactivate Judge → try login → blocked
- **File:** `tests/e2e/auth.spec.ts`
  - Visit dashboard without login → redirected to login
  - Login as Judge → try visiting /registrar → redirected to /judge
  - Invalid credentials → error message shown

### 8.3 — Loading states
- Add `loading.tsx` to each major route group:
  - `app/(dashboard)/registrar/cases/loading.tsx`
  - `app/(dashboard)/registrar/hearings/loading.tsx`
  - `app/(dashboard)/registrar/accounts/loading.tsx`
  - `app/(dashboard)/registrar/audit/loading.tsx`
  - `app/(dashboard)/judge/history/loading.tsx`
  - `app/(dashboard)/lawyer/history/loading.tsx`
  - `app/(dashboard)/lawyer/billing/loading.tsx`
- Use shadcn `Skeleton` — table skeleton (rows of rectangles), NOT spinner

### 8.4 — Empty states
- Every table/list page must handle the empty case:
  - Case list: "No cases registered yet. Register your first case."
  - Pending cases: "No pending cases."
  - Resolved cases: "No resolved cases in this date range."
  - Hearings: "No hearings scheduled for this date."
  - Accounts: "No user accounts." (unlikely but handle it)
  - Audit log: "No audit log entries." (unlikely)
  - Judge history: "No closed cases available."
  - Lawyer history: "No closed cases available."
  - Lawyer billing: "No case views recorded."
- Use plain text, centered. No illustrations. A relevant action link if applicable ("Register a case" link on empty case list).

### 8.5 — Form error states
- Verify every form shows field-level inline errors (red text below the input)
- Errors come from zod validation via `react-hook-form`
- No toast-based error display for validation failures — toasts only for server errors and success messages

### 8.6 — Responsive design pass
- Test every page at three widths: 1440px (desktop), 768px (tablet), 375px (mobile)
- Sidebar: collapses to hamburger on mobile
- Tables: horizontal scroll on mobile (wrap in `overflow-x-auto`)
- Forms: single column on mobile
- Case detail: info card moves to top on mobile
- Dialogs: full-width on mobile (`max-w-full` on small screens)

### 8.7 — Visual anti-AI-slop audit
Go through EVERY page and check:
- [ ] No gradient backgrounds anywhere
- [ ] No `rounded-3xl` on containers
- [ ] No emoji in headings or labels
- [ ] No rainbow-colored status badges
- [ ] No symmetric card grids
- [ ] No bouncing/sliding animations
- [ ] All inputs have visible labels
- [ ] Buttons use primary/muted palette, not bright blue
- [ ] Tables are dense and professional
- [ ] CIN always rendered in monospace
- [ ] Inter font loading correctly on all pages
- [ ] Overall feel: government records system, not SaaS startup dashboard

### 8.8 — README
- **File:** `README.md` (overwrite the placeholder)
- Sections:
  - Project description (2 sentences)
  - Tech stack (table from plan.md)
  - Prerequisites (Node, Supabase account)
  - Setup instructions (clone → npm install → env vars → prisma push → seed → dev)
  - Available scripts (`dev`, `build`, `test`, `test:e2e`, `prisma studio`)
  - Project structure overview (folder tree)
  - Roles and permissions summary
- No badges, no "Made with ❤️", no contributor section (it's an academic project)

### 8.9 — UAT checklist
- **File:** `docs/uat-checklist.md`
- Table with columns: FR#, Description, Registrar/Judge/Lawyer, Pass/Fail, Notes
- One row per FR1–FR21
- The human will manually walk through this during demo

### 8.10 — Production deployment
- Configure `next.config.ts` for production (no special config usually needed)
- Verify all env vars are set in Vercel dashboard
- Deploy via Vercel CLI or GitHub integration
- Test production URL

## How to verify

- `npm run test` — all Vitest tests pass
- `npx playwright test` — all E2E tests pass
- Every page loads at all three viewport widths without layout breaks
- Every empty state is handled gracefully
- Visual audit checklist all checked off
- README has correct setup instructions
- Production deployment works

## Commit messages

```
1. test: add vitest unit tests and playwright e2e tests for all modules
2. fix: responsive design, loading states, empty states, and form error handling
3. docs: add README with setup instructions, UAT checklist, and deploy config
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 8. Mark "Last worked on by" with the final date. The project is complete. 🎉
