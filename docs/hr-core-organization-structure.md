# Integrasi Struktur Organisasi HR Core

Halaman `/organization-development/organization-structure` membaca snapshot organisasi dari PostgreSQL HR Core. Integrasi ini hanya menggunakan view `core.v_org_unit` dan `core.v_org_edge`, selalu memakai `code` sebagai identitas, dan tidak melakukan operasi tulis.

## Konfigurasi

Gunakan secret environment server berikut:

- `HR_CORE_HOST=hrcore-postgres`, `HR_CORE_PORT=5432` untuk container pada Docker network `shared-network`; atau host `10.12.19.2` dan port `5435` dari VPC.
- `HR_CORE_DATABASE=hrcore`.
- `HR_CORE_USER` berisi role read-only dari steward.
- `HR_CORE_PASSWORD` diisi melalui secret manager atau environment deployment.
- `HR_CORE_POOL_MAX` opsional, default `5`.

`HR_CORE_DATABASE_URL` dapat dipakai sebagai alternatif dan mengambil prioritas atas field terpisah. Aplikasi menambahkan mode kompatibilitas libpq untuk `sslmode=prefer` bila belum ada, menetapkan `default_transaction_read_only=on`, dan membatasi statement selama 15 detik.

Mode `prefer` mencoba TLS lebih dahulu dan hanya beralih ke koneksi non-TLS bila server secara eksplisit menyatakan tidak mendukung SSL. Sesuai koneksi yang diberikan, gunakan integrasi ini pada network Docker/VPC privat, bukan endpoint publik.

## Endpoint

Semua endpoint membutuhkan session dengan akses workspace Organization Development atau Talent.

- `GET /api/organization-development/organization-tree` — seluruh forest bersarang.
- `GET /api/organization-development/organization-tree/{businessUnitCode}/subtree` — subtree satu Business Unit.
- `GET /api/organization-development/organization-tree/{code}/children` — direct children untuk lazy load.
- `GET /api/organization-development/organization-tree/{code}/breadcrumb` — jalur unit yang terlihat dalam scope.
- `GET /api/organization-development/organization-tree/{code}/positions` — kode posisi A003 aktif, tanpa nama pemegang.

Response diberi cache privat singkat dan UI tidak melakukan polling. Snapshot sumber diperbarui setiap malam pukul 01:15 WIB.

## Kontrak Talent AI

Katalog posisi internal memetakan target ke `positionCode`. Sebelum analisis, backend mencari penempatan resmi posisi tersebut di HR Core dengan relasi A003 dan memasukkan kode org-unit beserta breadcrumb ke `targetPositionProfile.officialOrganization`. Pencarian tidak memakai nama unit atau nama posisi. Jika kode belum dipetakan, koneksi belum tersedia, atau posisi tidak memiliki assignment aktif, payload ditandai `NOT_AVAILABLE_OR_NOT_ASSIGNED`; AI tidak boleh mengarang struktur maupun pemegang posisi.

Nilai `OrganizationPosition.positionCode` harus merupakan kode posisi SAP yang sama dengan `v_org_edge.to_code`, bukan kode hasil generate/import lokal. Pemetaan ini perlu disediakan secara eksplisit oleh pemilik data; aplikasi tidak mencoba menebaknya dari nama posisi. Opsi Career Path juga dipetakan melalui ID posisi internal ke kode SAP tersebut sebelum dikirim ke AI.

Jalankan `npm run test:hr-core-org` untuk memverifikasi logic forest tanpa database, lalu `npm run typecheck`, `npm run lint`, dan `npm run build` untuk verifikasi aplikasi.

Business Unit atau org-unit yang tidak muncul dianggap belum di-onboard dalam scope role HR Core, bukan otomatis sebagai kesalahan aplikasi.
