# Deploy awal HR Monitoring ke Linux VM dengan PostgreSQL lokal

Panduan ini memakai contoh checkout `/opt/hr-monitoring`, akun service
`hrmonitoring`, dan PostgreSQL pada `127.0.0.1:5432`. Sesuaikan nama akun,
direktori, dan nama database dengan VM. Folder `C:\secure` di laptop **tidak**
tersedia di Linux VM. Jangan commit file `.env`, JSON kredensial, atau
collection HSE ke Git.

## 1. Siapkan VM dan backup database laptop

Pasang Node.js versi yang mendukung Next.js 15, npm, Python 3, PostgreSQL client,
dan Git pada VM. PostgreSQL server sudah berada di VM. Pastikan database tujuan
belum berisi tabel aplikasi saat full restore.

Di laptop Windows, backup database PostgreSQL yang dipakai aplikasi (ganti
placeholder dengan nilai lokal):

```powershell
pg_dump -h 127.0.0.1 -U USER_LOKAL -d NAMA_DB_LOKAL -Fc -f hr-monitoring.dump
scp .\hr-monitoring.dump USER_VM@IP_VM:~/hr-monitoring.dump
```

Backup penuh membawa schema `public`, `bq_raw` bila ada di database yang sama,
data aplikasi, dan `_prisma_migrations`. Jika `bq_raw` berada di database lokal
terpisah, jalankan mirror BQ pertama di VM setelah restore. File di
`public/uploads` harus dipindahkan terpisah jika ingin mempertahankan unggahan.

Pada VM, buat role dan database kosong bila belum ada:

```bash
sudo -u postgres createuser --pwprompt hr_app
sudo -u postgres createdb -O hr_app hr_monitoring
chmod 600 ~/hr-monitoring.dump
pg_restore -h 127.0.0.1 -U hr_app -d hr_monitoring \
  --no-owner --no-acl --exit-on-error ~/hr-monitoring.dump
```

Jangan jalankan `prisma migrate deploy` sebelum full restore. Setelah restore,
periksa riwayat dan tabel sebelum menjalankan migrasi baru:

```bash
psql -h 127.0.0.1 -U hr_app -d hr_monitoring \
  -c "SELECT to_regclass('public.\"User\"'), to_regclass('bq_raw.p_emps');"
```

Migration `20260828072034_local_postgres_setup` berisi `DROP TABLE`. Jika ada
migration pending, baca SQL-nya dan backup database VM sebelum menjalankan
`npm run db:migrate:deploy`. Jangan gunakan `prisma migrate reset` pada VM.

## 2. Letakkan kode dan konfigurasi di VM

Clone repo ke `/opt/hr-monitoring` dan jalankan perintah berikut dari direktori
repo. Buat akun `hrmonitoring` bila belum ada, misalnya dengan
`sudo useradd --system --create-home --shell /usr/sbin/nologin hrmonitoring`.
Akun ini perlu memiliki checkout, hak baca ke konfigurasi,
serta hak tulis ke folder hasil integrasi dan `public/uploads`. Jalankan
`sudo chown -R hrmonitoring:hrmonitoring /opt/hr-monitoring` sekali setelah
clone, lalu jalankan perintah repo berikutnya sebagai akun `hrmonitoring`.

```bash
sudo mkdir -p /etc/hr-monitoring /var/lib/hr-monitoring
sudo chown hrmonitoring:hrmonitoring /etc/hr-monitoring /var/lib/hr-monitoring
sudo chmod 700 /etc/hr-monitoring /var/lib/hr-monitoring
sudo cp scripts/vm/app.env.example /etc/hr-monitoring/app.env
sudo cp scripts/vm/integrations.env.example /etc/hr-monitoring/integrations.env
```

Isi kedua file contoh tersebut dengan nilai VM. `DATABASE_URL` dan
`DIRECT_URL` harus mengarah ke database PostgreSQL yang sama di VM; untuk setup
satu VM tanpa pooler, kedua URL dapat sama. `NEXTAUTH_URL` adalah URL publik
yang akan dipakai user. Buat `NEXTAUTH_SECRET` baru. Berikan izin baca hanya
kepada akun service. Salin JSON service account BQ dan collection HSE dari
folder aman laptop lewat SSH ke path yang tercantum di
`integrations.env`. Contoh, dari laptop:

```powershell
scp "C:\secure\BQ_SERVICE_ACCOUNT.json" USER_VM@IP_VM:~/bq-service-account.json
scp "C:\secure\HSE_COLLECTION.json" USER_VM@IP_VM:~/hsect-collection.json
```

Lalu di VM, pindahkan ke folder aman dengan izin hanya untuk akun service:

```bash
sudo install -o hrmonitoring -g hrmonitoring -m 600 \
  ~/bq-service-account.json /etc/hr-monitoring/bq-service-account.json
sudo install -o hrmonitoring -g hrmonitoring -m 600 \
  ~/hsect-collection.json /etc/hr-monitoring/hsect-collection.json
```

Jangan salin ke folder repo. Jika konfigurasi lama memuat
`BQ_RAW_DATABASE_URL`, `DIRECT_URL`, atau `DATABASE_URL`, hapus baris itu:
runner VM memakai URL dari `app.env` untuk ketiga tahap.

```bash
sudo chown hrmonitoring:hrmonitoring /etc/hr-monitoring/*
sudo chmod 600 /etc/hr-monitoring/*
ln -s /etc/hr-monitoring/app.env .env
npm ci --include=dev
python3 -m venv .venv
./.venv/bin/python -m pip install -r scripts/requirements-bigquery-sync.txt
npx prisma migrate status
npm run build
```

Runner memakai `.venv/bin/python` secara default. Jika virtual environment
diletakkan di tempat lain, set `PYTHON_BIN` untuk akun/job tersebut. `.venv`
berada di checkout dan tidak boleh di-commit.

Contoh unit web tersedia di `scripts/vm/hr-monitoring-web.service.example`.
Salin ke `/etc/systemd/system/hr-monitoring-web.service`, sesuaikan path
`npm`, jalankan `sudo systemctl daemon-reload`, lalu
`sudo systemctl enable --now hr-monitoring-web.service`. Reverse proxy di VM
dapat meneruskan domain ke `127.0.0.1:3000`.

## 3. Jalankan integrasi setelah database siap

Runner `scripts/run-vm-integrations.sh` memuat `app.env`, lalu menjalankan:

1. BigQuery seluruh dataset ke schema `bq_raw`.
2. Tiga view BQ HR terkurasi ke tabel identitas/canonical.
3. HSE CT, dengan pencocokan ke `bq_raw.p_emps`, lalu impor ke database yang
   sama.

Jalankan pertama kali secara manual sebagai akun service:

```bash
cd /opt/hr-monitoring
sudo -u hrmonitoring bash scripts/run-vm-integrations.sh
```

Job akan berhenti jika suatu tahap mengembalikan error. Periksa log dan data
sebelum menjadwalkannya. Saat ini importer BQ/HSE dapat mencatat
`PARTIAL_SUCCESS` untuk error per baris tanpa menggagalkan proses; tinjau
`hr_integration_sync_runs` dan jumlah row sesudah job pertama.

Untuk menjalankan job melalui tombol **Sync sekarang** pada menu workspace,
service web dan service integrasi harus berjalan dengan akun `hrmonitoring`
yang sama. Aplikasi menjalankan wrapper
`scripts/run-vm-integrations-managed.sh`; wrapper memakai file lock agar sync
manual dan timer tidak dapat berjalan bersamaan. Status dan log tersimpan di
`runtime/integration-sync/`. Tombol hanya tersedia bagi Super Admin dan Admin.

Setelah job manual berhasil, contoh unit dan timer ada di
`scripts/vm/hr-monitoring-integrations.service.example` dan
`scripts/vm/hr-monitoring-integrations.timer.example`. Salin tanpa akhiran
`.example` ke `/etc/systemd/system/`, set timezone VM ke `Asia/Jakarta`,
jalankan `sudo systemctl daemon-reload`, lalu
`sudo systemctl enable --now hr-monitoring-integrations.timer`.

## 4. Perubahan berikutnya

- Perubahan kode: commit/push di laptop, lalu `git pull` di VM, `npm ci
  --include=dev`, `npm run build`, dan restart service web. Periksa migration
  baru sebelum menjalankan `npm run db:migrate:deploy`.
- Perubahan data sumber BQ/HSE: jalankan job integrasi lagi; `git pull` tidak
  diperlukan.
- Perubahan kredensial/path: perbarui file di `/etc/hr-monitoring`, lalu
  jalankan ulang job. Jangan commit secret ke Git.
- Sesudah scheduler VM aktif, matikan jadwal integrasi laptop agar tidak ada
  dua job yang menulis database bersamaan.
