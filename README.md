# HR Digital — Probation Monitoring

A focused web application for tracking the **probation period of new hires** (100 days). It gives employees a transparent view of their onboarding progress and final probation presentation, while letting HR manage the entire process.

> This is **not** a full HRIS. Scope is intentionally limited to the two areas that matter during probation: **Probation Activities** and the **Probation Presentation**.

See [`requirements/deployment.md`](./requirements/deployment.md) for the deployment guide covering Vercel and Supabase.

---

## Workspace architecture

The product is organized into five HR workspaces (Onboarding, Organization Development, Talent, Learning, and Retire) plus a separate Probation workspace for New Hires. For now there are two active roles: Super Admin HR has all HR workspace access, while New Hire only has access to its own Probation workspace.

See [`docs/workspace-access-architecture.md`](./docs/workspace-access-architecture.md) for the workspace catalogue, authorization model, API contract, and migration guidance.

## Organization structure: integrated data, not CSV output

Production reads **only** the role-scoped HR Core views with `mycareer_ro`: `core.v_org_unit`, `core.v_org_edge`, and `core.v_business_unit`. No base-table reads, database writes, CSV fallback, or consumer-side BU security filters are added. Credentials remain server environment secrets; request the password from Alwin out-of-band, never through repo/ticket/chat.

`GET /api/organization-development/organization-tree` returns a forest with Group-relative `depth`/`path`, plus `businessUnits` and `snapshot: { lastLoad, snapshotsVisible }`. The read-only repeatable-read transaction keeps tree and metadata together; mixed snapshots are rejected. `GET /api/organization-development/organization-tree/status` returns BU/snapshot metadata with the same OD/Talent session authorization. The UI shows the actual last load in WIB and grouping/pillar labels without inventing Group ancestors. It does not poll automatically.

### How HRP1000/HRP1001-shaped integration data becomes a chart

The sample files illustrate **source row schemas**, not a requested upload workflow or CSV output. HRP1000 provides typed object masters (`O` = unit, `S` = position); HRP1001 supplies relationships between typed object codes. Names are labels only. A unit hierarchy and a position reporting hierarchy are distinct graphs.

`normalizeSapOmRows` in `src/lib/services/integrations/sap-om/sap-om-rows.ts` accepts arrays of integration rows independently of their transport (an authorized read-only database source or API). It returns a nested unit `forest`, `positionAssignments`, code-only `positions` with `orgUnitCodes` and `reportsToPositionCode`, and deduplicated `positionReporting` links. No CSV parser is involved in this function. Codes and SAP validity dates must arrive as strings; the caller supplies the snapshot's `asOf` date, plan, client, and language. The adapter does not fetch any SAP base table or certify scope.

```typescript
const model = normalizeSapOmRows(masterRows, relationshipRows, {
  asOf: snapshotDate, planVersion: "01", client: "100", language: "E",
});
// model.forest: units and their children/position codes
// model.positions: position codes, unit assignments, reporting-parent codes
// Inspect model.status and model.issues before using the model.
```

| Source relationship | Normalized meaning |
| --- | --- |
| HRP1000 `OTYPE=O`, `OBJID`, `STEXT` | Unit code/name selected by plan, status, language, and full validity range |
| HRP1001 `O A002 O` | Child unit=`OBJID`, parent unit=`SOBID` |
| HRP1001 `O B002 O` | Parent unit=`OBJID`, child unit=`SOBID` |
| HRP1001 `S A003 O` | Position=`OBJID`, assigned unit=`SOBID` |
| HRP1001 `O B003 S` | Unit=`OBJID`, attached position=`SOBID` |
| HRP1001 `S A002 S` / reciprocal `S B002 S` | Position reporting to a superior position; never a unit parent |
| Any relationship involving `P` | Excluded; no person/holder IDs or names are emitted |

SAP documents the [position-to-unit and position-to-manager defaults](https://help.sap.com/docs/successfactors-employee-central-integration-to-business-suite/replicating-employee-master-data-and-organizational-assignments-from-employee-central-to-sap-erp-hcm/organizational-assignment-types-in-employee-central-and-sap-erp-hcm?locale=en-US). Different configured relationships require an explicitly confirmed contract, not guesses.

For the documented deployment, normalization happens **upstream in HR Core**; this application already reads the canonical views into its forest API/UI. Do **not** reinterpret the runbook's canonical unit-to-position `A003` edge as the raw SAP `S A003 O` direction. The raw-row adapter is a separate prepared integration boundary, not a fallback in production. If delivery changes to raw rows, first obtain the authorized view/API names and verify BU scope and atomic snapshot metadata. The existing `mycareer_ro` grant does not authorize HRP1000/HRP1001 base-table queries. The documented views do not establish an S-to-S reporting contract: the prepared raw mapping cannot supply official manager relationships to the live UI/AI until that source is provided.

Object identity uses type plus code within one selected plan/client. Reciprocal relationships are deduplicated; conflicting parents, cycles, and overlapping conflicting unit names block forest publication. Invalid position reporting also clears the reporting links and superior codes instead of choosing an arbitrary manager. Missing unit masters are reported without invented labels. Missing scoped ancestors are valid forest boundaries, but raw rows alone do not prove BU onboarding. S masters are optional for code-only position display. Raw `relativeDepth` is extract-root-relative, not HR Core Group depth. Row results remain `source=SAP_OM_ROWS`, `official=false`, `scopeVerified=false` until an authorized source contract exists; production UI and Talent AI continue to trust the scoped HR Core service only. AI joins use explicit `OrganizationPosition.positionCode` = SAP position code, not names.

The supplied sample pair contains 1,000 rows per file, zero O/S masters in HRP1000, no O-to-O hierarchy rows in HRP1001, and zero source/target code matches between the files. This does not make the **row format** wrong: it means those sample subsets do not contain enough matching master/hierarchy data for a complete named unit chart. The adapter still identifies S-to-O memberships and active S-to-S reporting independently; it does not fabricate missing unit names.

### Optional fixture diagnostics (not a product import feature)

The CSV utility is only a test reader around the same row mapper, available without database credentials:

```powershell
# Windows: npm.cmd preserves the CLI flags through the PowerShell wrapper.
npm.cmd run org:inspect:sap-csv -- --hrp1000 "C:\secure-exports\Sample_HRP1000.csv" --hrp1001 "C:\secure-exports\Sample_HRP1001.csv" --as-of 2026-09-18 --language E --plan-version 01 --client 100 --output runtime\sap-org-report.json
```

On Linux use `npm run` with the same arguments and Linux paths. The as-of date must be the intended extract/snapshot date, not an assumption of realtime SAP data. The output file is created exclusively (existing files are not overwritten); keep generated reports under git-ignored `runtime/`. An incomplete report deliberately exits nonzero (direct script exit code 2). There is no import or upload endpoint.

Verification commands: `npm run test:hr-core-org`, `npm run test:sap-org-rows`, `npm run test:sap-org-csv`, `npm run typecheck`, `npm run lint`, and `npm run build`.

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
| **Super Admin HR** (`HR_ADMIN`) | Akses penuh ke seluruh workspace dan seluruh fungsi administrasi HR |
| **New Hire** (`NEW_HIRE`) | Dashboard, task, presentation, dan profile setup untuk Probation miliknya sendiri |

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
| Super Admin HR | `admin@hrdigital.com` | `admin123` |
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

## HR/Admin module menu

HR/Admin now lands on 4 module workspaces:

| Module | Routes | Notes |
| --- | --- | --- |
| Onboarding | `/recruitment`, `/recruitment/probation-monitoring` | Contains the existing Probation Monitoring flow. Legacy `/admin/dashboard`, `/admin/employees`, `/admin/tasks`, `/admin/presentations`, `/admin/coaching`, and `/admin/reports` remain available. |
| Organization Development | `/organization-development`, `/organization-development/organization-structure`, `/organization-development/skills`, `/organization-development/job-descriptions` | Placeholder OD master data for organization structure, position skills, and job descriptions. |
| Talent | `/talent`, `/talent/promotion`, `/talent/development-program`, `/talent/rotation`, `/talent/gap` | Uses post-probation employee/talent mock data and existing Talent Directory/Talent Card routes. |
| Learning | `/learning`, `/learning/idp` | Shows IDP recommendations based on skill gap, promotion, and rotation needs. |

All top-level module routes are protected for `HR_ADMIN` through middleware and the shared admin layout.

### Mock data and future integration

The module pages read from `src/lib/services/hr-modules.service.ts`. This service defines reusable mock/read models for employee master data, organization structure, required position skills, job descriptions, promotion, development program, rotation, gap, and learning recommendations.

Placeholder data sources are prepared for SAP HR, MCU, Payroll, Performance, LMS, and Manual HR Input. To replace mock data with real integrations later, keep the page components unchanged and swap the service implementation to call SAP/HRIS/LMS/API connectors.

Intended real-data flow:

1. SAP HR provides employee master, organization, position, job level, and career history.
2. OD master provides required skills and job descriptions.
3. Performance/Assessment sources provide rating, potential, readiness, and competency evidence.
4. MCU/HSE sources provide health and operational eligibility.
5. LMS provides learning history and certification status.
6. Talent AI/IDP uses the consolidated evidence to recommend matching, skill gap, and development actions, with HR retaining final decision authority.

---

## License

Internal project. All rights reserved.

---

# Sinkronisasi BigQuery dan HSE CT

Skrip `scripts/sync_bigquery_raw.py` menarik semua table/view BigQuery pada dataset yang dikonfigurasi ke schema PostgreSQL `bq_raw`. Ini dipakai saat data warehouse menambah tabel atau kolom baru, karena nama tabel dan kolom sumber dipertahankan apa adanya. Service-account JSON dan konfigurasi tidak boleh disimpan di repositori.

1. Salin `scripts/bq-hr-sync.env.example` ke lokasi aman di luar repositori (misalnya `C:\secure\bq-hr-sync.env`) dan isi nilai proyek/dataset.
2. Instal dependensi pada interpreter yang akan digunakan scheduler: `py -3 -m pip install -r scripts/requirements-bigquery-sync.txt`.
3. Mirror semua tabel/view BigQuery: `npm run db:sync:bigquery:raw -- C:\secure\bq-hr-sync.env`. Job ini mempertahankan index read utama dan memperbarui statistik PostgreSQL setelah copy selesai.
4. Jika masih butuh import tiga view HR terkurasi ke tabel integrasi lama, jalankan: `py -3 scripts/sync_bigquery_hr.py --config C:\secure\bq-hr-sync.env`.
5. Ambil dan import HSE CT dari collection Postman: `npm run db:sync:hsect:api -- C:\secure\bq-hr-sync.env --import-db`. Isi `BQ_RAW_DATABASE_URL` pada konfigurasi agar employee HSE diprefilter dengan exact `personnel_number` dari `bq_raw.p_emps` sebelum detail API dipanggil.
6. Daftarkan jadwal tanggal 4 dan 17 tiap bulan: `powershell -ExecutionPolicy Bypass -File scripts\register-bigquery-sync-task.ps1 -ConfigPath C:\secure\bq-hr-sync.env -At 04:00`.

Jadwal berjalan pada akun Windows yang mendaftarkannya; akun tersebut harus tetap dapat membaca service-account JSON dan menjalankan Node/npm.

Rancangan schema, quality gate, urutan job, dan target deployment Cloud Run/Cloud SQL tersedia di `docs/gcp-data-architecture.md`.

Learning IDP memakai master employee BigQuery dan menyimpan hanya perubahan monitoring user pada tabel `learning_monitoring`. User `HR_USER` membutuhkan grant workspace `LEARNING` minimal `EDITOR` untuk mengubah monitoring. Career Path memakai competency OD bila tersedia, lalu fallback ke profil BQ dan katalog posisi yang sudah ada; hasil AI selalu disimpan untuk audit dan membutuhkan human review.
