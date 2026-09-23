# Phase 4 — Hearing Scheduling, Adjournment & Proceedings

> **Context:** Read `AGENTS.md` first. Phases 0–3 must be complete. Cases and courtrooms should exist in the database.

## What you are building

The core operational loop: schedule hearings (checking courtroom/judge availability), record adjournments with reasons, record hearing summaries, and view the full case timeline. This is the most complex phase.

## Functional Requirements covered

- **FR8:** System displays available hearing slots given judge/courtroom availability.
- **FR9:** Registrar assigns a hearing date from vacant slots.
- **FR10:** Registrar records adjournment reason + new hearing date.
- **FR11:** Registrar records hearing summary + next hearing date.
- **FR16:** Query cases by hearing date (partially — overview page).
- **FR17:** Full case status/history by CIN (case detail page).

## Tasks

### 4.1 — Hearing validators
- **File:** `lib/validators/hearing.ts`
- `scheduleHearingSchema`: cin (string), hearingDate (date, must be future or today), courtroomId (string, uuid)
- `recordAdjournmentSchema`: hearingId (string, uuid), adjournmentReason (string, min 5 — required, never allow empty), nextHearingDate (date, optional)
- `recordSummarySchema`: hearingId (string, uuid), proceedingSummary (string, min 10), nextHearingDate (date, optional)

### 4.2 — Hearing server actions
- **File:** `actions/hearing.actions.ts`

**`getAvailableSlots(date, judgeId)`:**
1. Role check (REGISTRAR)
2. Query all active courtrooms
3. For each courtroom, count Hearings on `date` → compare against `maxSlots`
4. Check if judge already has a hearing on that date
5. Return list of courtrooms with remaining capacity, excluding those where judge is already booked
6. Return shape: `{ courtroomId, courtroomName, remainingSlots }[]`

**`scheduleHearing(cin, date, courtroomId)`:**
1. Role check (REGISTRAR)
2. Validate with `scheduleHearingSchema`
3. Re-check capacity (in case of race condition) — if courtroom at max, reject
4. Re-check judge availability — if judge booked on that date, reject
5. Insert Hearing row (status: SCHEDULED, courtroomId, hearingDate)
6. If Case status is REGISTERED → update to PENDING
7. `logAudit('HEARING_SCHEDULED')`
8. Revalidate page

**`recordAdjournment(hearingId, reason, nextHearingDate?)`:**
1. Role check (REGISTRAR)
2. Validate — reason MUST be non-empty
3. Update Hearing: status → ADJOURNED, `adjournmentReason = reason`
4. Update Case: status → ADJOURNED
5. If `nextHearingDate` provided, schedule a new Hearing automatically
6. `logAudit('HEARING_ADJOURNED')`

**`recordHearingSummary(hearingId, summary, nextHearingDate?)`:**
1. Role check (REGISTRAR)
2. Update Hearing: status → COMPLETED, `proceedingSummary = summary`
3. If `nextHearingDate` provided, schedule a new Hearing
4. `logAudit('HEARING_COMPLETED')`

**`getHearingsByDate(date)`:**
1. Query Hearings for that date with Case + Courtroom info included

**`getCaseHearings(cin)`:**
1. Query all Hearings for a CIN, ordered by `hearingDate desc`

### 4.3 — Case detail page
- **File:** `app/(dashboard)/registrar/cases/[cin]/page.tsx`
- Server Component: fetch case + hearings + judgment
- Layout:
  - **Top section:** Case info card — CIN (monospaced), defendant, crime type, status badge, assigned personnel, dates
  - **Action bar:** buttons for "Schedule Hearing", "Record Judgment" (only if case not closed). These open dialogs.
  - **Bottom section:** Hearing timeline — chronological list of all hearings with status, date, courtroom, summary/adjournment reason
- This page component should use **shared components** that will be reused by Judge/Lawyer views in Phase 6:
  - `components/shared/case-detail.tsx` — case info display (read-only)
  - `components/shared/hearing-timeline.tsx` — hearing list

### 4.4 — Schedule hearing dialog
- **File:** `app/(dashboard)/registrar/hearings/schedule-dialog.tsx` (client component)
- Step 1: Pick a date (shadcn `Calendar`)
- Step 2: On date select → call `getAvailableSlots(date, judgeId)` → show available courtrooms
- Step 3: Registrar picks courtroom, confirms
- On success: close dialog, revalidate case detail page, show toast

### 4.5 — Adjournment dialog
- **File:** `app/(dashboard)/registrar/hearings/adjournment-dialog.tsx` (client component)
- Triggered from a "Mark Adjourned" action on a SCHEDULED hearing in the timeline
- Fields: Reason for Adjournment (textarea, required), Next Hearing Date (date picker, optional)
- On submit: call `recordAdjournment`

### 4.6 — Hearing summary dialog
- **File:** `app/(dashboard)/registrar/hearings/summary-dialog.tsx` (client component)
- Triggered from a "Record Summary" action on a SCHEDULED hearing in the timeline
- Fields: Proceeding Summary (textarea, required), Next Hearing Date (date picker, optional)
- On submit: call `recordHearingSummary`

### 4.7 — Hearings overview page
- **File:** `app/(dashboard)/registrar/hearings/page.tsx`
- Date picker at top → shows all hearings for that date in a table
- Columns: CIN, Defendant, Courtroom, Status (Scheduled/Completed/Adjourned), Judge
- Clickable CIN → navigate to case detail
- Default: today's date

## Design notes

- **Case detail page:** Dominant left panel (case info + timeline takes ~70% width). Right side shows a compact info card with personnel and dates. On mobile: single column, info card on top.
- **Hearing timeline:** Vertical timeline — each hearing is a row with a left-border colored by status (muted for completed, accent for scheduled, destructive for adjourned). No icons on the timeline dots.
- **Schedule dialog:** Two-panel layout — calendar on left, available slots list on right. Compact.
- **Hearings overview:** Dense table, no frills. Government register.

## How to verify

- Open a case → schedule a hearing for tomorrow in Courtroom A. Hearing appears in timeline with status SCHEDULED.
- Schedule another hearing for the same day + same courtroom → should succeed (if under maxSlots) or fail (if at capacity).
- Schedule a hearing on a day where the judge already has one → rejected.
- Mark a hearing as adjourned with reason "Defendant absent" → status changes, case becomes ADJOURNED.
- Record a hearing summary "Cross-examination completed" → hearing status COMPLETED.
- Check hearings overview for today → scheduled hearings appear.
- **TC2, TC6, TC8** should pass.

## Commit messages

```
1. feat(hearings): add case detail page with hearing timeline component
2. feat(hearings): implement slot availability check, scheduling, and adjournment
3. feat(hearings): add hearing summary recording and hearings overview page
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 4.
