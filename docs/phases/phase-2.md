# Phase 2 — Account Management (Registrar)

> **Context:** Read `AGENTS.md` first. Phases 0–1 must be complete. Login, middleware, sidebar, and `getCurrentUser()` should all be working.

## What you are building

Registrar can create new user accounts (Judge, Lawyer, or another Registrar), view all accounts in a data table, and deactivate/reactivate them. Every action is audit-logged.

## Functional Requirements covered

- **FR1:** Registrar can create login accounts for Judges, Lawyers, and other Registrars.
- **FR2:** Registrar can delete/deactivate any login account.
- **FR21 / NFR7:** All account operations logged to AuditLog.

## Tasks

### 2.1 — AuditLog helper (reusable)
- **File:** `actions/audit.actions.ts`
- `logAudit(actorId, action, entity, entityId, details?)` — inserts AuditLog row via Prisma
- `action` values: `USER_CREATED`, `USER_DEACTIVATED`, `USER_REACTIVATED`, `CASE_CREATED`, `CASE_STATUS_CHANGED`, `HEARING_SCHEDULED`, `HEARING_ADJOURNED`, `HEARING_COMPLETED`, `JUDGMENT_RECORDED`, `CASE_VIEWED`
- This helper will be imported by every other actions file in future phases

### 2.2 — Zod validators
- **File:** `lib/validators/user.ts`
- `createUserSchema`: name (string, min 2), email (email format), password (string, min 6), role (enum: REGISTRAR | JUDGE | LAWYER)
- `deactivateUserSchema`: userId (string, uuid)

### 2.3 — User server actions
- **File:** `actions/user.actions.ts`
- `createUser(data)`:
  1. `getCurrentUser()` — must be REGISTRAR, else reject
  2. Validate with `createUserSchema`
  3. Create user in Supabase Auth (`supabase.auth.admin.createUser`)
  4. Create matching User row in Prisma
  5. `logAudit(actorId, 'USER_CREATED', 'User', newUserId)`
  6. Return `{ success: true, data: user }`
- `deactivateUser(userId)`:
  1. Role check (REGISTRAR)
  2. Set `isActive = false` on Prisma User row
  3. `logAudit(actorId, 'USER_DEACTIVATED', 'User', userId)`
- `reactivateUser(userId)`:
  1. Role check (REGISTRAR)
  2. Set `isActive = true` on Prisma User row
  3. `logAudit(actorId, 'USER_REACTIVATED', 'User', userId)`
- `getAllUsers()`:
  1. Role check (REGISTRAR)
  2. Return all User rows ordered by `createdAt desc`

### 2.4 — Account list page
- **File:** `app/(dashboard)/registrar/accounts/page.tsx`
- Server Component: fetch users via `getAllUsers()`
- shadcn `Table` — columns: Name, Email, Role, Status (active/inactive), Created
- Status shown as plain text with a subtle dot indicator or muted text — NOT a colored pill
- Rows are dense (compact padding). No hover card effects.
- "Create Account" button in the top-right corner
- Each row has a dropdown menu (⋮) with Deactivate/Reactivate action

### 2.5 — Create account dialog
- **File:** `app/(dashboard)/registrar/accounts/create-account-dialog.tsx` (client component)
- Opens as shadcn `Dialog`
- Form fields: Name, Email, Temporary Password, Role (shadcn `Select` dropdown)
- On submit: call `createUser` server action
- Success → close dialog, show toast, revalidate page
- Error → show inline error message in the dialog

### 2.6 — Update login to check isActive
- **File:** `actions/auth.actions.ts` (update from Phase 1)
- After successful Supabase auth, check `user.isActive` — if false, sign out immediately and return error "Account has been deactivated"

## Design notes

- Account table: left-aligned text in all columns. No center-alignment. Role column uses plain text (not a badge).
- Create dialog: 400px max width. Form labels above inputs. Submit button right-aligned at bottom.
- Toast messages: use `sonner` — "Account created for judge@example.com" (short, specific).

## How to verify

- **Manual:** Create a Judge account via the dialog. See it in the table. Deactivate it — status changes. Try logging in as that Judge — blocked with "Account has been deactivated" message. Reactivate — login works again.
- **Unit tests (Vitest):**
  - `createUser` rejects when called by a non-REGISTRAR
  - `createUser` rejects duplicate email
  - `deactivateUser` creates an AuditLog entry
  - `logAudit` inserts correct fields

## Commit messages

```
1. feat(accounts): add user list page and create account dialog with audit logging
2. feat(accounts): implement deactivate/reactivate actions and login guard
3. test: add unit tests for user creation, deactivation, and audit logging
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 2.
