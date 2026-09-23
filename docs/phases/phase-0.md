# Phase 0 — Project Scaffold & Infrastructure

> **Context:** Read `AGENTS.md` first for full project context. Read `plan.md` §1, §5, §7 for tech stack, schema, and folder structure.

## What you are building

A bootable Next.js 15 app with the complete Prisma schema, Supabase auth wired, shadcn/ui installed, and the custom design system configured. No features yet — just the skeleton that everything else will be built on.

## Prerequisites

- Node.js 18+ installed
- A Supabase project created (the human will give you the URL, anon key, and service role key)
- Git initialized in this repo

## Tasks (in order)

### 0.1 — Initialize Next.js app
- Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"` (or equivalent if already partially initialized)
- Ensure `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `package.json` exist

### 0.2 — Install and configure shadcn/ui
- Run `npx shadcn@latest init` — choose New York style, neutral base color
- Install these components: `button`, `input`, `label`, `card`, `table`, `badge`, `dialog`, `form`, `calendar`, `command`, `tabs`, `sonner`, `dropdown-menu`, `separator`, `skeleton`, `sheet`, `select`, `textarea`, `popover`, `tooltip`

### 0.3 — Set up design system
In `app/globals.css`, replace the default shadcn palette with:
```css
--background: oklch(0.985 0.002 247);
--foreground: oklch(0.145 0.015 260);
--primary: oklch(0.28 0.045 230);
--primary-foreground: oklch(0.96 0.005 90);
--accent: oklch(0.50 0.12 55);            /* burnt sienna */
--accent-foreground: oklch(0.98 0.005 55);
--muted: oklch(0.93 0.008 260);
--muted-foreground: oklch(0.55 0.015 260);
--destructive: oklch(0.45 0.15 25);
--border: oklch(0.88 0.008 260);
--ring: oklch(0.50 0.12 55);
--radius: 0.375rem;
```

In `app/layout.tsx`, configure Inter font via `next/font/google`.

### 0.4 — Install and configure Prisma
- `npm install prisma @prisma/client`
- `npx prisma init`
- Copy the full schema from `plan.md` §5 into `prisma/schema.prisma`
- Models: User, Courtroom, Case, Hearing, Judgment, CaseView, AuditLog
- Enums: Role, CaseStatus, HearingStatus

### 0.5 — Create Supabase client helpers
- `lib/prisma.ts` — Prisma client singleton (global cached for dev HMR)
- `lib/supabase/client.ts` — browser Supabase client (`createBrowserClient`)
- `lib/supabase/server.ts` — server-side Supabase client (`createServerClient` with cookies)
- Install: `npm install @supabase/supabase-js @supabase/ssr`

### 0.6 — Create env files
- `.env.local` (gitignored) with actual values
- `.env.example` (committed) with placeholder keys:
  ```
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."
  NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
  ```

### 0.7 — Create shared types
- `types/index.ts` — re-export Prisma-generated types + any custom types needed

### 0.8 — Create route group shells
All should render simple placeholder text (e.g. "Registrar Dashboard — coming soon"):
- `app/(auth)/login/page.tsx`
- `app/(dashboard)/layout.tsx` (basic HTML shell, no sidebar yet)
- `app/(dashboard)/registrar/page.tsx`
- `app/(dashboard)/judge/page.tsx`
- `app/(dashboard)/lawyer/page.tsx`

### 0.9 — Run Prisma migration
- `npx prisma db push` (or `prisma migrate dev --name init`)
- Verify with `npx prisma studio`

### 0.10 — Update .gitignore
Ensure these are ignored: `node_modules/`, `.next/`, `.env.local`, `.env*.local`

## How to verify

- `npm run dev` boots at `localhost:3000` without errors
- `/login`, `/registrar`, `/judge`, `/lawyer` all render placeholder pages
- `npx prisma studio` shows all 7 tables (empty)
- A button rendered with `bg-primary` shows deep slate, not default blue
- Inter font is loading (check browser dev tools → Computed → font-family)

## Commit messages (human commits manually)

```
1. chore: scaffold next.js 15 app with typescript, tailwind, and prisma schema
2. chore: configure shadcn/ui, design system palette, and inter font
3. chore: add supabase client helpers, route group shells, and env template
```

## After this phase

Update `AGENTS.md` §8 — check off Phase 0. Add your name/model and date to "Last worked on by."
