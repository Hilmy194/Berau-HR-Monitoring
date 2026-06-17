# HR Digital — Probation Monitoring

A focused web application for tracking the **probation period of new hires** (100 days). It gives employees a transparent view of their onboarding progress and final probation presentation, while letting HR manage the entire process.

> This is **not** a full HRIS. Scope is intentionally limited to the two areas that matter during probation: **Probation Activities** and the **Probation Presentation**.

See [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) for the full business brief and roadmap.

---

## Features (v1)

### Probation Activities
- Employees see a progress view of all onboarding tasks and can update the status of their own checklist items (onboarding, ID collection, laptop, email activation, HR/department induction, safety training, mid-probation review, …).
- HR has full CRUD over tasks (create, assign, update status, delete) from both a global task board and per-employee detail view.

### Probation Presentation
- Employees see: **Date, Time, Location, Meeting Link, Assigned Panelists, Final Score, Recommendation**.
- HR schedules presentations, manages panelists (add/remove), and submits the final score + recommendation, which automatically updates the employee's probation status.

### Permissions
| Role | Access |
|------|--------|
| **New Hire** (`NEW_HIRE`) | Read-only dashboard, tasks (self-check only), presentation + one-time profile setup |
| **HR Admin** (`HR_ADMIN`) | Full CRUD across employees, tasks, presentations, panelists, scores |

Enforced at three layers: edge middleware, server-component guards, and per-route API guards.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React Server Components)
- **Language**: TypeScript
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (JWT session, credentials provider, bcrypt)
- **Database**: SQLite via [Prisma](https://www.prisma.io/) (PostgreSQL-ready — see notes below)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) patterns (Radix primitives)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Toasts**: Sonner

---

## Getting Started

### Prerequisites
- Node.js 18.18+ (or 20+)
- npm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env .env.local   # then edit if needed; defaults work for local dev
```

`.env` is pre-configured for local SQLite:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="hr-digital-probation-monitoring-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
```

> Generate a fresh `NEXTAUTH_SECRET` for any non-local deployment: `openssl rand -base64 32`

### Database setup

```bash
# Create the SQLite database and run migrations
npx prisma migrate dev --name init

# Seed demo data (1 HR admin + 1 sample new hire with tasks & a presentation)
npm run db:seed
```

### Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| HR Admin | `admin@hrdigital.com` | `admin123` |
| New Hire | `employee@hrdigital.com` | `employee123` |

New hires can also self-register at `/register`, which redirects them to a one-time profile-setup flow.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Prisma generate + production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed` | Seed demo data |
| `npx prisma migrate dev` | Apply schema migrations |
| `npx prisma studio` | Browse the database at http://localhost:5555 |

> `db:seed` is defined via the `prisma.seed` field in `package.json`.

---

## Project Structure

```
prisma/
├─ schema.prisma          # Data model (User, Profile, ProbationTask, Presentation, Panelist, AuditLog)
├─ seed.ts                # Demo data
└─ migrations/            # Prisma migration history

src/
├─ app/
│  ├─ (auth)/             # Login + register (public)
│  │  ├─ login/           #   page.tsx wraps login-form.tsx in <Suspense>
│  │  └─ register/
│  ├─ (app)/              # Employee area (NEW_HIRE only)
│  │  ├─ dashboard/       #   probation timeline, task progress, presentation summary
│  │  ├─ tasks/           #   read-only probation activities
│  │  └─ presentation/    #   presentation details + result
│  ├─ admin/              # HR area (HR_ADMIN only)
│  │  ├─ dashboard/       #   KPIs, charts, recent hires, upcoming presentations
│  │  ├─ employees/       #   table + [id] detail with tabs (Profile/Tasks/Presentation/Documents)
│  │  ├─ tasks/           #   global task management
│  │  └─ presentations/   #   global presentation management
│  ├─ profile/setup/      # One-time new-hire profile completion
│  └─ api/
│     ├─ auth/            # NextAuth + register
│     ├─ admin/           # All HR mutations (guarded by assertAdmin)
│     └─ profile/setup    # Profile completion endpoint
├─ components/
│  ├─ ui/                 # shadcn/ui primitives (Button, Card, Dialog, …)
│  ├─ shell/              # App shell, sidebar, topbar
│  ├─ admin/              # HR-only dialogs, search, charts
│  └─ profile/            # Profile setup form
├─ lib/
│  ├─ auth.ts             # NextAuth config (Credentials provider, JWT callbacks)
│  ├─ session.ts          # requireAuth / requireAdmin / getCurrentProfile
│  ├─ api-guard.ts        # assertAdmin (returns 401/403 or session)
│  ├─ validations.ts      # Zod schemas for every input shape
│  ├─ constants.ts        # Roles, status enums, departments, labels, nav items
│  └─ services/           # Business logic (employee, task, presentation, probation, audit)
├─ middleware.ts          # Edge auth + role-based route protection
└─ types/next-auth.d.ts   # Session type augmentation (role, id)
```

---

## API Reference

All `/api/admin/*` routes require an authenticated `HR_ADMIN` session (returns `401` unauthenticated, `403` otherwise).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/register` | Self-register a new hire |
| `POST` | `/api/auth/[...nextauth]` | NextAuth sign-in / callback |
| `POST` | `/api/profile/setup` | One-time profile completion (new hire) |
| `POST` | `/api/admin/employees` | Create employee + profile (requires join date) |
| `GET`  | `/api/admin/employees/[id]` | Fetch full profile |
| `PATCH`| `/api/admin/employees/[id]` | Update profile / user / probation status |
| `DELETE` | `/api/admin/employees/[id]` | Cascade delete (user + profile + tasks + presentations + panelists) |
| `POST` | `/api/admin/tasks` | Create task (assigned to a profile) |
| `PATCH`| `/api/admin/tasks/[id]` | Update task |
| `DELETE` | `/api/admin/tasks/[id]` | Delete task |
| `POST` | `/api/admin/presentations` | Schedule presentation (one per employee enforced) |
| `PATCH`| `/api/admin/presentations/[id]` | Update presentation logistics (does NOT touch score) |
| `DELETE` | `/api/admin/presentations/[id]` | Delete presentation |
| `POST` | `/api/admin/presentations/[id]/panelists` | Add panelist |
| `DELETE` | `/api/admin/presentations/[id]/panelists/[panelistId]` | Remove panelist |
| `POST` | `/api/admin/presentations/[id]/score` | Submit score + recommendation (recomputes probation status) |

All mutations are recorded in the `AuditLog` table with the acting admin's user id.

---

## How business rules are centralised

- **Probation timeline**: `lib/services/probation.service.ts` computes the 100-day end date and task progress.
- **Final recommendation**: `submitScore()` → `applyFinalResult()` is the single path that updates a score. It sets the presentation result status, the profile probation status, and (for `EXTENDED`) appends `PROBATION_EXTENSION_DAYS` (default 30) to the probation end date. The PATCH presentation endpoint intentionally cannot mutate score/result to keep this invariant.
- **Status enums**: Defined in `lib/constants.ts` and surfaced via shared `STATUS_LABELS` so dropdowns and badges never drift.
- **Validation**: All input is validated with Zod schemas in `lib/validations.ts`; the same schemas drive both client forms and server route handlers.

---

## Production Notes

- **Database**: The schema is written for SQLite to keep local setup zero-config. Enum-like fields are plain `String` with app-layer Zod validation. Switching to PostgreSQL only requires changing the `datasource` provider — no client code changes are needed. To enforce enums at the DB layer, convert the `String` columns to native Postgres enums.
- **Secrets**: Rotate `NEXTAUTH_SECRET`, remove the demo-credentials box from `src/app/(auth)/login/page.tsx` (or gate it behind `NODE_ENV !== "production"`), and use strong seeded passwords.
- **Rate limiting / lockout**: Not implemented in v1. Add before exposing `/api/auth/register` and login to the public internet.

---

## Roadmap

Per `PROJECT_CONTEXT.md`:

- **v2** — SAP integration, email notifications, Looker dashboard, automated score calculation
- **v3** — Panelist login, online evaluation form, approval workflow

These are intentionally out of scope for the current version.

---

## License

Internal project. All rights reserved.
