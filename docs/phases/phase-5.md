# Phase 5 — Case Resolution & Registrar Queries

> **Context:** Read `AGENTS.md` first. Phases 0–4 must be complete. Cases can be created, hearings scheduled/adjourned/completed.

## What you are building

Registrar can record judgments (closing cases permanently) and run all four query types: pending cases, resolved cases by date range, cases by hearing date, and case status by CIN.

## Functional Requirements covered

- **FR12:** Record judgment summary, mark case Closed/Resolved.
- **FR13:** Closed case records remain permanently accessible (read-only).
- **FR14:** Query pending cases sorted by CIN.
- **FR15:** Query resolved cases by date range.
- **FR16:** Query cases by hearing date (full implementation).
- **FR17:** Query full case status by CIN.

## Tasks

### 5.1 — Judgment validator
- **File:** `lib/validators/case.ts` (add to existing)
- `recordJudgmentSchema`: cin (string), judgmentDate (date), summary (string, min 10)

### 5.2 — Judgment server action
- **File:** `actions/case.actions.ts` (add to existing)

**`recordJudgment(cin, judgmentDate, summary)`:**
1. Role check (REGISTRAR)
2. Validate
3. Check Case doesn't already have a Judgment → reject if it does (immutable)
4. Check Case status is PENDING or ADJOURNED → reject if REGISTERED (no hearings held yet) or already CLOSED
5. Insert Judgment row
6. Update Case status → RESOLVED, then → CLOSED (can do both in one update, set to CLOSED)
7. `logAudit('JUDGMENT_RECORDED')`
8. Revalidate case detail page

### 5.3 — Record judgment dialog
- **File:** `app/(dashboard)/registrar/cases/[cin]/judgment-dialog.tsx` (client component)
- Fields: Judgment Date (date picker), Judgment Summary (textarea)
- Only visible/accessible if case is PENDING or ADJOURNED (not REGISTERED, not CLOSED)
- After recording: case becomes read-only — all action buttons disappear

### 5.4 — Read-only enforcement for closed cases
- **Update:** `components/shared/case-detail.tsx` and the case detail page
- If `case.status === 'CLOSED'` or `case.status === 'RESOLVED'`:
  - Hide "Schedule Hearing", "Record Judgment" buttons
  - Show judgment info prominently at the top of the timeline
  - Add a subtle "CLOSED" banner/indicator (not a modal, just a text label)
- This is a UI-level guard. Server actions already reject via status checks.

### 5.5 — Query server actions
- **File:** `actions/case.actions.ts` (add to existing)

**`getPendingCases()`:**
- Returns cases where `status IN ('REGISTERED', 'PENDING', 'ADJOURNED')`
- Includes judge, prosecutor, lawyer names
- Sorted by CIN ascending

**`getResolvedCases(fromDate, toDate)`:**
- Returns cases that have a Judgment with `judgmentDate BETWEEN fromDate AND toDate`
- Includes judge name, judgment summary
- Sorted by judgmentDate ascending

**`getCasesByHearingDate(date)`:**
- Returns cases that have at least one Hearing on that date
- Includes hearing details for that date

**`getCaseByCin(cin)`:**
- Returns single case with all relations (hearings, judgment, judge, prosecutor, lawyer)
- Already partially exists from Phase 4 — ensure it's exposed as a standalone action

### 5.6 — Pending cases page
- **File:** `app/(dashboard)/registrar/cases/pending/page.tsx`
- Server Component calling `getPendingCases()`
- Table columns: CIN (mono), Start Date, Defendant Name, Defendant Address, Crime Type, Lawyer, Prosecutor, Judge
- Sorted by CIN

### 5.7 — Resolved cases page
- **File:** `app/(dashboard)/registrar/cases/resolved/page.tsx`
- Date range picker at top (From / To date inputs)
- Table columns: Start Date, CIN, Judgment Date, Judge, Judgment Summary
- Sorted by judgment date
- Default range: last 30 days

### 5.8 — Cases by hearing date page
- **File:** `app/(dashboard)/registrar/cases/by-hearing/page.tsx`
- Date picker at top
- Table of cases with hearings on that date
- Default: today

### 5.9 — CIN search entry point
- **Update:** `app/(dashboard)/registrar/cases/page.tsx`
- Add a search input at the top of the case list page
- On submit: navigate to `/registrar/cases/[cin]` (the case detail page from Phase 4)
- If CIN not found: show "No case found with CIN: ..." message

### 5.10 — Update sidebar nav
- Registrar sidebar "Cases" should expand to show sub-links: All Cases, Pending, Resolved, By Hearing Date
- Or use tabs within the cases section. Either approach works — keep it clean.

## Design notes

- **Query pages:** Each is a simple page with a filter control at the top and a dense table below. No complex filter panels. One filter per page (date range for resolved, single date for hearing-date, none for pending).
- **Judgment section in case detail:** Displayed as a distinct block at the top of the timeline when case is closed — muted background, judgment date and summary clearly readable.
- **CIN search:** An input with a search icon, not a command palette. Placed in the top bar area of the case list page.

## How to verify

- Record a judgment on a case that has had hearings → status changes to CLOSED
- Try scheduling a hearing on the closed case → action button is gone
- Try recording another judgment on the same case → rejected (already has one)
- Pending cases page shows only non-closed cases
- Resolved cases page with a date range returns the closed case
- Cases by hearing date returns cases with hearings on the selected date
- Search by CIN → opens case detail
- Search by invalid CIN → "not found" message
- **TC7** should pass.

## Commit messages

```
1. feat(cases): implement judgment recording and case closure logic
2. feat(queries): add pending, resolved, and by-hearing-date query pages
3. feat(cases): add CIN search, read-only enforcement for closed cases
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 5.
