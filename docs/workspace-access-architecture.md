# Workspace & Access Architecture

## Scope

Harmoni has five operational HR workspaces and one separate employee-facing Probation workspace. The catalogue in `src/lib/workspaces.ts` is the single source of truth for workspace identity, route ownership, navigation, and descriptions. Do not add workspace routes or sidebar items in separate hard-coded lists.

| Key | Workspace | Base route | Audience |
|---|---|---|---|
| `ONBOARDING` | Onboarding | `/recruitment` | HR team assigned to onboarding |
| `ORGANIZATION_DEVELOPMENT` | Organization Development | `/organization-development` | Assigned HR team |
| `TALENT` | Talent | `/talent` | Assigned HR team |
| `LEARNING` | Learning | `/learning` | Assigned HR team |
| `RETIRE` | Retire | `/retire` | Assigned HR team |
| `PROBATION` | My Probation | `/dashboard` | New Hire only |

Legacy `/admin/*` routes are mapped to their current workspace in the same catalogue so active links remain functional while future work can migrate to the domain routes above.

## Authorization model

Saat ini hanya ada dua role aktif. Pengaturan user dan akses per-workspace
disiapkan sebagai pengembangan berikutnya, tetapi belum diaktifkan sebagai role
ketiga.

| Role | Effective access |
|---|---|
| `HR_ADMIN` | Super Admin HR: full access to all five HR workspaces dan seluruh administrasi |
| `NEW_HIRE` | Probation workspace miliknya sendiri; tidak dapat menerima akses HR workspace |

`UserWorkspaceAccess` tetap disediakan untuk tahap berikutnya, saat role HR
operasional dan pengaturan akses per user mulai diaktifkan.

The server layouts enforce entry to each workspace. `HR_ADMIN` API access remains protected by `assertAdmin`. New workspace APIs should call the workspace guard before reading or mutating module data.

## Assigning access

Tahap berikutnya: hanya `HR_ADMIN` yang dapat mengatur grant per workspace
untuk user HR operasional. Endpoint berikut belum diperlukan dalam model dua
role saat ini:

```
GET /api/admin/users/:id/workspace-access
PUT /api/admin/users/:id/workspace-access
```

Example request body:

```json
{
  "workspace": "TALENT",
  "accessLevel": "EDITOR",
  "isActive": true
}
```

New Hire tetap terisolasi pada Probation. Saat role HR operasional ditambahkan,
target grant tidak boleh menggunakan role `NEW_HIRE`.

## Adding a workspace

1. Add the key, routes, description and navigation to `src/lib/workspaces.ts`.
2. Create a protected route layout that calls `requireWorkspaceAccess`.
3. Add API checks using the same workspace key.
4. Extend schema/API validation only if the new workspace should be assignable.
5. Add a forward-only Prisma migration; never edit an applied migration.

## Database deployment

The migration `20260902090000_add_workspace_access` creates `UserWorkspaceAccess`.

```bash
npm run db:generate
npm run db:migrate:deploy
```

Review all pre-existing pending migrations before deployment. This repository contains a separate local migration with destructive table drops; it must be approved independently and is not part of workspace access.
