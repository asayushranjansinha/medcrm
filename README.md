# MedCRM

Medical territory management CRM for pharmaceutical teams — HCPs, products, visits, dispatches, dashboard KPIs, and Excel exports.

## Stack

- Next.js 15 (App Router), TypeScript (strict)
- PostgreSQL + Drizzle ORM
- Auth.js (NextAuth v5) — credentials + JWT
- Shadcn/UI + Tailwind CSS v4
- TanStack Query + Table, Zustand, Zod, React Hook Form, ExcelJS, Recharts, Sonner

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.local.example .env.local
   ```

   Set a real `DATABASE_URL` (local Postgres or Neon) and generate `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`).

3. **Database**

   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

4. **Seed**

   ```bash
   npm run db:seed
   ```

   Default logins:

   - `admin@medcrm.com` / `Admin@123`
   - `manager@medcrm.com` / `Manager@123`
   - `mr@medcrm.com` / `Mr@123`

5. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — you will be redirected to sign in or the dashboard.

## Scripts

| Script            | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Next.js dev (Turbopack)    |
| `npm run build`   | Production build           |
| `npm run db:generate` | Drizzle SQL migrations |
| `npm run db:migrate`  | Apply migrations       |
| `npm run db:push`     | Push schema (dev only) |
| `npm run db:seed`     | Seed sample data       |
| `npm run db:studio`   | Drizzle Studio         |

## Notes

- `DATABASE_URL` must point to a live Postgres instance for runtime and seeds. A placeholder URL is only used so `next build` can compile without a DB.
- All domain tables include nullable `organizationId` for future multi-tenancy.
- RBAC: **ADMIN** sees all territories; **MANAGER** / **MR** are scoped by territory and assignment rules in `lib/rbac.ts` and services.
