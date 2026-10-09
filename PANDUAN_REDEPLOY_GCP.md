# 🚀 Panduan Redeploy HR Monitoring ke GCP VM (harmoni.beraucoal.co.id)

Dokumen ini berisi panduan lengkap *step-by-step* untuk memperbarui (*redeploy*) aplikasi Harmoni HR Monitoring di server GCP VM setelah adanya penambahan fitur **User Management & Hak Akses Granular**, pembaruan favicon Harmoni, dan struktur organisasi.

---

## 📌 Ringkasan Perubahan yang Di-deploy:
1. **User Management & Hak Akses Menu Granular (Super Admin):**
   * Panel manajemen user (`/admin/user-management`) untuk mendaftarkan user baru (Nama, Email, Role).
   * Checkbox granular untuk 5 workspace (Onboarding, OD, Talent, Learning, Retire) dan semua submenunya.
   * Menu & submenu yang tidak dicentang otomatis berstatus **🔒 Terkunci** bagi user bersangkutan.
   * Default password login awal: `password`.
2. **Favicon Resmi Harmoni:** Menggunakan `harmoni-logo.png` (mendukung browser modern dan legacy).
3. **Struktur Organisasi 1 Halaman:** Tampilan terpadu berbasis hierarki (Direktorat → Divisi → Departemen → Posisi & Pemegang Jabatan) dengan 3 summary card dan live search.
4. **Skema Database:**
   * Kolom `holder_personnel_number`, `reports_to_id`, dan `external_supervisor` pada tabel `organization_positions`.
   * Kolom `allowedRoutes` pada tabel `User`.

---

## 💻 LANGKAH 1: Dari Komputer Lokal (Laptop)

### 1.1. Periksa Status dan Push Perubahan ke Git
Jalankan di terminal proyek lokal:
```powershell
# 1. Periksa file yang telah diubah
git status

# 2. Tambahkan semua perubahan ke Git staging
git add .

# 3. Commit perubahan dengan pesan yang deskriptif
git commit -m "feat: user management with granular menu access, organization view, and favicon"

# 4. Push ke repository remote
git push origin main
```
*(Catatan: Sesuaikan nama branch jika branch kerja Anda bukan `main`, misal `master` atau branch staging).*

---

### 1.2. (Opsional) Salin File Data Master Organisasi ke VM
*Jika database di GCP menggunakan PostgreSQL lokal di dalam VM (bukan shared cloud database), salin file data atasan ke server melalui SCP:*
```powershell
scp data\private\data-atasan-karyawan.md USER_VM@IP_VM:/opt/hr-monitoring/data/private/
```

---

## ☁️ LANGKAH 2: Di Server GCP (Lewat SSH)

### 2.1. Masuk ke Server GCP via SSH
```bash
ssh USER_VM@IP_VM
```

---

### 2.2. Masuk ke Direktori Proyek & Tarik Kode Terbaru
```bash
cd /opt/hr-monitoring

# Tarik commit terbaru dari repository
git pull origin main
```

---

### 2.3. Update Dependencies & Jalankan Migrasi Database
Jalankan migrasi schema agar kolom pelaporan atasan dan hak akses user aktif di database server:
```bash
# 1. Pastikan dependencies up-to-date
npm ci --include=dev

# 2. Generate Prisma Client terbaru
npx prisma generate

# 3. Jalankan migrasi database (Aman / Non-destructive)
npm run db:migrate:deploy
```
> **Catatan:** Migrasi ini hanya menambahkan kolom baru (`ADD COLUMN IF NOT EXISTS`) dan **tidak menghapus (DROP) tabel atau data apapun yang sudah ada di server GCP**.

---

### 2.4. (Khusus Database Baru / Lokal VM) Import Data 618 Karyawan
*Jika data 618 organisasi belum ada di database VM, jalankan import 1x:*
```bash
npm run db:import:reporting-lines
```

---

### 2.5. Build Aplikasi Next.js untuk Produksi
```bash
npm run build
```
*(Tunggu hingga proses build selesai dengan indikator sukses 0 error).*

---

### 2.6. Restart Service Web di VM
Restart service systemd agar aplikasi memuat hasil build terbaru:
```bash
sudo systemctl restart hr-monitoring-web.service
```

Periksa status service untuk memastikan aplikasi berjalan dengan baik:
```bash
sudo systemctl status hr-monitoring-web.service
```

---

## 🌐 LANGKAH 3: Verifikasi di Browser

1. Buka browser dan kunjungi: **`https://harmoni.beraucoal.co.id`**
2. Lakukan **Hard Refresh** (`Ctrl + Shift + R` di Windows/Linux atau `Cmd + Shift + R` di Mac).
3. Cek halaman berikut:
   * **Login sebagai Super Admin (`superadmin@harmoni.com`):** Muncul tombol & banner **Manajemen Pengguna** di `/admin` dan di dropdown profil atas.
   * **Buka `/admin/user-management`:** Coba daftarkan akun baru, pilih role, dan centang submenu tertentu saja (misal hanya Talent -> Promotion).
   * **Login dengan akun baru tersebut:** Pastikan hanya submenu yang dicentang yang bisa dibuka, sedangkan menu lainnya berstatus **🔒 Terkunci**.

---

## 🛠️ Troubleshooting Cepat (Bila Terjadi Kendala)

* **Melihat Log Error Web Real-time:**
  ```bash
  sudo journalctl -u hr-monitoring-web.service -f -n 50
  ```
* **Memperbaiki Hak Akses Folder Proyek (Permission Error):**
  ```bash
  sudo chown -R hrmonitoring:hrmonitoring /opt/hr-monitoring
  ```
