# Judiciary Information System (JIS)

The Judiciary Information System (JIS) is an enterprise full-stack web application designed for court administrative registries, presiding judicial officers, and legal practitioners to manage court dockets, schedule chamber hearings, and search immutable judicial archives. Built to government records standards, the platform enforces strict role-based access control, automated Case Identification Number (CIN) tracking, statutory fee-per-view legal research billing, and immutable append-only audit logging.

---

## Tech Stack

| Layer | Technology | Specification / Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 15.x |
| Language | TypeScript | 5.6+ |
| User Interface | React 19 + Tailwind CSS 4 + shadcn/ui | Component system |
| Typography & Icons | Inter Variable + Lucide React | Clean government aesthetic |
| Database | Supabase PostgreSQL | Relational storage + RLS |
| Identity & Auth | Supabase Auth (Email / Password) | Session & JWT tokens |
| ORM | Prisma | 5.22.0 |
| Form Validation | React Hook Form + Zod | Schema-backed client/server validation |
| Test Suites | Vitest (Unit) + Playwright (E2E) | Automated test coverage |
| Deployment Target | Vercel (Edge/Serverless) + Supabase Cloud | Managed production infrastructure |

---

## Prerequisites

- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm**: v9 or newer
- **Supabase Account**: A PostgreSQL database instance with Supabase Auth enabled

---

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd jis
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Connections (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase Auth & Public API
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Initial Administrative Personnel Passwords (Optional Defaults)
INITIAL_REGISTRAR_PASSWORD="Registrar@123456"
INITIAL_JUDGE_PASSWORD="Judge@123456"
INITIAL_LAWYER_PASSWORD="Lawyer@123456"
```

### 3. Initialize Database Schema & Seed Data

Push the Prisma schema to your PostgreSQL database and seed the default courtrooms and initial users:

```bash
# Push Prisma schema to Supabase Postgres
npm run db:push

# Generate Prisma client bindings
npm run db:generate

# Seed initial Registrar, default Judge, default Lawyer, and Courtroom chambers
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `npm run dev` | Runs the Next.js development server with Turbopack |
| `build` | `npm run build` | Compiles an optimized production build |
| `start` | `npm run start` | Runs the compiled production server |
| `lint` | `npm run lint` | Runs ESLint across the codebase |
| `test` | `npm test` | Runs all Vitest unit tests |
| `test:e2e` | `npm run test:e2e` | Runs Playwright end-to-end integration tests |
| `db:generate` | `npm run db:generate` | Generates the Prisma Client |
| `db:push` | `npm run db:push` | Synchronizes schema definitions with the target PostgreSQL database |
| `db:seed` | `npm run db:seed` | Seeds initial courtrooms and role personnel |
| `db:studio` | `npm run db:studio` | Launches Prisma Studio GUI for database inspection |

---

## Project Structure Overview

```
jis/
├── actions/                     # Next.js Server Actions (Business Logic & Mutations)
│   ├── audit.actions.ts         # Immutable audit logging & administrative querying
│   ├── auth.actions.ts          # Session authentication & role routing
│   ├── case.actions.ts          # Case registration, status transitions, search & queries
│   ├── caseView.actions.ts      # Lawyer pay-per-view tracking & judge case inspection
│   ├── courtroom.actions.ts     # Courtroom chamber registry & slot allocation
│   ├── hearing.actions.ts       # Scheduling, adjournments, proceeding summaries
│   └── user.actions.ts          # Personnel account provisioning & deactivation
├── app/                         # Next.js App Router
│   ├── (auth)/login/            # Authentication login portal
│   ├── (dashboard)/             # Role-protected dashboard layouts
│   │   ├── judge/               # Judicial dashboard & complimentary case archive
│   │   ├── lawyer/              # Legal dashboard, pay-per-view repository & billing ledger
│   │   └── registrar/           # Administrative portal (cases, hearings, courtrooms, audit)
│   ├── layout.tsx               # Root layout with Inter font and design tokens
│   ├── error.tsx                # Government-styled error boundary
│   └── not-found.tsx            # Standardized 404 response
├── components/                  # Reusable React UI Components
│   ├── accounts/                # Personnel directory table & creation dialog
│   ├── audit/                   # Server-log audit filter bar & log entry table
│   ├── auth/                    # Login form component
│   ├── cases/                   # Case registration form, tables, judgment dialogs
│   ├── courtrooms/              # Courtroom chamber cards & creation dialog
│   ├── hearings/                # Hearing scheduling, adjournment & summary dialogs
│   ├── lawyer/                  # Pay-per-view charge confirmation modal & history table
│   ├── shared/                  # Navigation sidebar, topbar, CIN badge, case search, skeletons
│   └── ui/                      # Base shadcn component library
├── lib/                         # Core Utilities, Configs & Database Clients
│   ├── auth.ts                  # Server-side identity & session verification helpers
│   ├── constants.ts             # Application constants (e.g. ₹50 statutory view charge)
│   ├── prisma.ts                # Prisma Client instance
│   ├── supabase/                # Supabase SSR and service-role client factories
│   └── validators/              # Zod validation schemas
├── prisma/
│   ├── schema.prisma            # Single source of truth database schema
│   └── seed.ts                  # Database seeding script
├── supabase/
│   └── rls-policies.sql         # PostgreSQL Row-Level Security policy definitions
├── tests/
│   ├── e2e/                     # Playwright end-to-end integration test suites
│   └── unit/                    # Vitest unit test suites
├── docs/
│   ├── phases/                  # Step-by-step implementation phase guides (0–8)
│   └── uat-checklist.md         # User Acceptance Testing verification matrix
├── AGENTS.md                    # Project agent handout and progress tracker
└── plan.md                      # Comprehensive Software Requirements & UML Architecture Plan
```

---

## Roles & Permissions Matrix

| Capability / Function | Registrar | Judge | Lawyer |
|---|:---:|:---:|:---:|
| Provision & deactivate personnel accounts | Yes | No | No |
| Create and manage courtroom chambers | Yes | No | No |
| Register new cases & generate CIN | Yes | No | No |
| Schedule, adjourn, and record hearings | Yes | No | No |
| Record judicial judgments & close cases | Yes | No | No |
| Query pending, resolved, and daily case lists | Yes | No | No |
| View case archive (Complimentary access) | Yes | Yes | No |
| View case archive (Statutory fee debited at ₹50/view) | — | — | Yes |
| Itemized billing ledger & fee statements | No | No | Yes |
| Universal case record keyword lookup | Yes (All Cases) | Yes (Closed Only) | Yes (Closed Only) |
| Inspect system mutation audit logs | Yes | No | No |

---

## Production Deployment

### Vercel Deployment
1. Import the repository into the Vercel Dashboard.
2. In Project Settings > Environment Variables, configure:
   - `DATABASE_URL` (Supabase transaction pooler URL on port 6543 with `?pgbouncer=true`)
   - `DIRECT_URL` (Supabase direct connection URL on port 5432)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy the application. Next.js App Router and Turbopack will optimize serverless functions and static pages automatically.
