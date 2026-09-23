# Phase 6 — Judge & Lawyer Dashboards, Case History & Billing

> **Context:** Read `AGENTS.md` first. Phases 0–5 must be complete. The full Registrar workflow is done. Now we build the Judge and Lawyer experiences.

## What you are building

Judge dashboard with free case history browsing. Lawyer dashboard with charged case viewing (each view logged and billed). Keyword search across case records for all roles. Lawyer billing page. Registrar dashboard upgrade with real stats.

## Functional Requirements covered

- **FR4:** Track per-lawyer case view count and log (for billing).
- **FR18:** Judges browse closed cases for free.
- **FR19:** Lawyers browse closed cases, charged per view, each view logged.
- **FR20:** Keyword search across past case records.

## Tasks

### 6.1 — CaseView server actions
- **File:** `actions/caseView.actions.ts`

**`viewCaseAsLawyer(cin, lawyerId)`:**
1. `getCurrentUser()` — must be LAWYER and `userId === lawyerId`
2. Fetch the case — must be CLOSED status
3. Insert `CaseView` row with `chargeAmount` (use a configurable constant, e.g. `CHARGE_PER_VIEW = 50.00`)
4. `logAudit('CASE_VIEWED')`
5. Return the full case details (with hearings, judgment)

**`getLawyerBilling(lawyerId)`:**
1. Must be LAWYER and `userId === lawyerId`
2. Fetch all CaseView rows for this lawyer, include case details
3. Return rows + total charge sum

**`viewCaseAsJudge(cin)`:**
1. Must be JUDGE
2. Fetch the case — must be CLOSED
3. Do NOT insert CaseView row (free access)
4. Return full case details

### 6.2 — Search server action
- **File:** `actions/case.actions.ts` (add to existing)

**`searchCases(query, role)`:**
1. Role check — all roles can search
2. Search across: `defendantName`, `crimeType`, `crimeLocation`, `arrestingOfficer`, and if the case has a Judgment, the `summary` field
3. Use Prisma `contains` (case-insensitive) across multiple fields with `OR`
4. For Judge/Lawyer: only return CLOSED cases
5. For Registrar: return all cases
6. Limit results to 50
7. Return cases with basic info (CIN, defendant, crime type, status, judgment date if exists)

### 6.3 — Keyword search component
- **File:** `components/shared/case-search.tsx` (client component)
- Search input with search icon (NOT shadcn Command palette — just a regular input + results list)
- Debounced input (300ms) → call `searchCases`
- Results rendered as a list below the input (inline, not a modal)
- Clicking a result navigates to the case detail page (route depends on role)

### 6.4 — Judge dashboard
- **File:** `app/(dashboard)/judge/page.tsx`
- Stats: Total closed cases available, recent searches (stored in localStorage, not DB)
- Clean, minimal. A welcome message + the search component prominently placed.

### 6.5 — Judge history page
- **File:** `app/(dashboard)/judge/history/page.tsx`
- Table of all CLOSED cases (paginated if many)
- Keyword search component at top
- Clicking a row → opens case detail (reuse `components/shared/case-detail.tsx` + `hearing-timeline.tsx`)
- No charge, no CaseView logging

### 6.6 — Judge case detail page
- **File:** `app/(dashboard)/judge/history/[cin]/page.tsx`
- Server Component: call `viewCaseAsJudge(cin)` → render using shared components
- Read-only. No action buttons. Just case info + hearing timeline + judgment.

### 6.7 — Lawyer dashboard
- **File:** `app/(dashboard)/lawyer/page.tsx`
- Stats: Cases viewed this month, total charges this month, total charges all-time
- The search component prominently placed
- A notice: "Viewing case details incurs a charge of ₹50 per case."

### 6.8 — Lawyer history page
- **File:** `app/(dashboard)/lawyer/history/page.tsx`
- Same table of CLOSED cases as judge
- Keyword search at top
- Clicking a row → **confirmation dialog** before opening: "Viewing case [CIN] will incur a charge of ₹50. Continue?"
- On confirm → call `viewCaseAsLawyer` → navigate to detail page

### 6.9 — Lawyer case detail page
- **File:** `app/(dashboard)/lawyer/history/[cin]/page.tsx`
- Server Component: case detail rendered using shared components
- A subtle indicator at the top: "You were charged ₹50 for viewing this case on [date]"
- Read-only. No action buttons.

### 6.10 — Lawyer billing page
- **File:** `app/(dashboard)/lawyer/billing/page.tsx`
- Table of all CaseView entries: CIN (mono), Case (defendant name), Viewed Date, Charge Amount
- Summary bar at top: "Total charges: ₹X across Y case views"
- Sorted by viewedAt desc (most recent first)

### 6.11 — Registrar dashboard upgrade
- **File:** `app/(dashboard)/registrar/page.tsx` (replace Phase 0 placeholder)
- Stats displayed:
  - Pending cases count
  - Today's scheduled hearings count
  - Total active users
  - Cases closed this month
- Layout: NOT a 2×2 grid. Use a wide stats strip (horizontal row of 4 numbers) at the top, then a "Today's Hearings" table below, then a "Recent Activity" list (last 5 AuditLog entries).

## Design notes

- **Judge/Lawyer case detail:** Identical to registrar case detail visually, but without any action buttons. Same shared components.
- **Charge confirmation dialog:** Simple shadcn `Dialog` — title, message, Cancel + Confirm buttons. No illustration, no icon.
- **Billing table:** Dense. Amount column right-aligned. Total in bold at top.
- **Registrar dashboard stats:** Numbers displayed as `text-3xl font-semibold` with a small label below each. No colored backgrounds on the number blocks. Just numbers on the page.
- **Search component:** Not a floating command palette. An input field with results listed below it, integrated into the page. Results disappear when you navigate away.

## How to verify

- **Judge flow:** Log in as Judge → see dashboard → go to history → see closed cases → click one → full detail loads → no CaseView row in DB.
- **Lawyer flow:** Log in as Lawyer → go to history → click a case → see confirmation → confirm → detail loads → CaseView row in DB → check billing page → entry visible with ₹50 charge. Click same case again → second CaseView row created → billing shows two entries.
- **Search:** Search "theft" → cases with crimeType containing "theft" appear. Works for all three roles.
- **Registrar dashboard:** Shows real stats — pending count matches pending query, hearings count matches today's hearings.
- **TC3:** Two views → two CaseView rows.
- **TC4:** Judge view → no CaseView row.

## Commit messages

```
1. feat(judge): add judge dashboard and free case history browsing
2. feat(lawyer): add lawyer dashboard, charged case viewing, and billing page
3. feat(search): implement keyword search across case records for all roles
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 6.
