# Judiciary Information System (JIS) — User Acceptance Testing (UAT) Checklist

This document provides a comprehensive verification checklist for evaluating all functional requirements (FR1–FR21) across the three primary actor roles: **Registrar**, **Judge**, and **Lawyer**.

---

## Acceptance Testing Matrix

| FR # | Functional Requirement Description | Target Role(s) | Verification Procedure / Test Steps | Status | Notes |
|:---:|:---|:---:|:---|:---:|:---|
| **FR1** | Create user accounts for Judges, Lawyers, and Registrars with assigned roles | Registrar | Navigate to `/registrar/accounts`, click "Provision Account", submit valid details. Verify user appears in directory. | **PASS** | Evaluated via unit tests & UI dialog |
| **FR2** | Deactivate user login accounts | Registrar | In `/registrar/accounts`, click action menu on an active user and select "Deactivate Account". Verify status changes to deactivated. | **PASS** | Prevents self-deactivation of logged-in registrar |
| **FR3** | Role-based authentication and route restriction | All Roles | Log in with role credentials. Confirm unauthorized subroutes (e.g. Judge accessing `/registrar/audit`) redirect immediately. | **PASS** | Enforced at middleware, layout, and server actions |
| **FR4** | Track and itemize case views per lawyer for billing | Lawyer | As Lawyer, view closed case docket via `/lawyer/history/[cin]`. Confirm ₹50 fee prompt. Check `/lawyer/billing` for itemized row. | **PASS** | Tested in `caseView.actions.test.ts` (TC3) |
| **FR5** | Case registration with incident details | Registrar | Navigate to `/registrar/cases/new`. Fill defendant name, address, crime type, date, location, arresting officer, arrest date. | **PASS** | Validated via `case-registration-form.tsx` |
| **FR6** | Automatic CIN generation | System | Submit new case form. System auto-generates a unique Case Identification Number in format `CIN-YYYY-XXXXX`. | **PASS** | Uniqueness enforced by Prisma schema |
| **FR7** | Record judicial officers, defense counsel, and trial schedule | Registrar | In `/registrar/cases/new`, assign Judge, Public Prosecutor, Defense Lawyer, trial start date, and expected completion date. | **PASS** | Enforces valid role types on assigned IDs |
| **FR8** | Display available hearing slots based on judge/courtroom capacity | Registrar | Navigate to case detail or `/registrar/hearings`, click "Schedule Hearing". Verify remaining slot counts per courtroom and judge availability. | **PASS** | Evaluated in `hearing.actions.test.ts` |
| **FR9** | Assign hearing date and courtroom chamber | Registrar | Select valid courtroom slot and calendar date in hearing dialog. Confirm hearing is scheduled. | **PASS** | Prevents booking on full courtrooms or conflicting judges |
| **FR10** | Record adjournment reason and update case status | Registrar | In case detail timeline, click "Adjourn Hearing", provide statutory reason (min 5 chars). Verify status updates to `ADJOURNED`. | **PASS** | Tested in `hearing.actions.test.ts` (TC5) |
| **FR11** | Record proceeding summary and mark hearing completed | Registrar | In case detail timeline, click "Record Summary", enter proceeding notes. Verify status updates to `COMPLETED`. | **PASS** | Stored in immutable `Hearing` row |
| **FR12** | Record judgment summary and close case | Registrar | When case has recorded proceedings, click "Record Judgment". Enter decree summary (min 10 chars). Verify status changes to `CLOSED`. | **PASS** | Tested in `judgment.actions.test.ts` (TC6) |
| **FR13** | Permanent read-only archive for closed cases | All Roles | Open closed case. Confirm action buttons (adjourn, schedule, judgment) are disabled/hidden and read-only banner is displayed. | **PASS** | Read-only view enforced on closed dockets |
| **FR14** | Query pending cases sorted by CIN | Registrar | Navigate to `/registrar/cases/pending`. Verify table lists all non-closed cases sorted by CIN with complete party details. | **PASS** | Excludes `CLOSED` and `RESOLVED` cases |
| **FR15** | Query resolved cases by judgment date range | Registrar | Navigate to `/registrar/cases/resolved`. Filter by start/end date. Confirm matching cases and judgment decrees display. | **PASS** | Evaluated in `judgment.actions.test.ts` |
| **FR16** | Query scheduled hearings by calendar date | Registrar | Navigate to `/registrar/hearings`. Select date using date picker. Confirm daily docket lists assigned courtrooms and judges. | **PASS** | Filter supported on `/registrar/hearings?date=...` |
| **FR17** | Query full docket history by CIN | Registrar | Search or navigate to `/registrar/cases/[cin]`. Verify full case metadata, hearing timeline, and judgment decree are displayed. | **PASS** | Complete history preserved |
| **FR18** | Free case archive browsing for Judges | Judge | Log in as Judge. Open `/judge/history` and view closed dockets. Confirm no fees are prompted or billed. | **PASS** | Tested in `caseView.actions.test.ts` (TC4) |
| **FR19** | Billed case archive browsing for Lawyers | Lawyer | Log in as Lawyer. Open `/lawyer/history`. Confirm confirmation modal warns of ₹50 charge before accessing docket. | **PASS** | ₹50 fee debited and logged on access |
| **FR20** | Universal keyword search across case archives | All Roles | Use search bar on dashboard or archive pages. Search by defendant name, crime type, location, or judgment excerpt. | **PASS** | Role-scoped (Judge/Lawyer see closed; Registrar sees all) |
| **FR21** | Immutable, timestamped audit log for mutations | System | Perform any mutation (create case, schedule hearing, record judgment). Check `/registrar/audit` for immutable log entry. | **PASS** | Tested in `audit.actions.test.ts` (TC9) |

---

## Default Personnel Test Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Registrar** | `registrar@jis.local` | `Registrar@123456` | Full administrative control, case registration, hearing scheduling, audit log viewer |
| **Judge** | `judge@jis.local` | `Judge@123456` | Judicial case law archive, complimentary closed case inspection, keyword search |
| **Lawyer** | `lawyer@jis.local` | `Lawyer@123456` | Pay-per-view case archive (₹50/view), itemized billing statements, keyword search |
