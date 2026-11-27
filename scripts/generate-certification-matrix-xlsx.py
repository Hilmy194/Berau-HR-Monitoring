#!/usr/bin/env python3
"""Generate Excel workbook (.xlsx) for Standar S-HCT-04.01 (Izin Bekerja di Daerah Operasi)."""

from __future__ import annotations

import html
import zipfile
from pathlib import Path

OUT_PATH = Path("data/certifications/matriks-sertifikasi-working-permit-s-hct-04-01.xlsx")

MATRIX_HEADERS = [
    "No",
    "No Dokumen",
    "Revisi",
    "Halaman",
    "No Kategori",
    "Kategori Pekerja",
    "Work Permit",
    "Identitas Karyawan",
    "Lisensi",
    "Sertifikat Internal",
    "Sertifikat Eksternal",
    "Riwayat Kesehatan",
    "Lokasi Penugasan",
]

MATRIX_ROWS = [
  {
    "orderIndex": 1,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 1,
    "category": "KARYAWAN (Mandatory)",
    "workPermitPosition": "KARYAWAN",
    "employeeIdentity": "KTP Atau KITAS",
    "license": "SID CARD",
    "internalCertificates": "KMPD - DASAR K3 PERTAMBANGAN UMUM",
    "externalCertificates": "",
    "healthRequirement": "FIT Untuk Bekerja atau FIT Untuk Bekerja Dengan Catatan",
    "location": "Site Penugasan"
  },
  {
    "orderIndex": 2,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS OPERASIONAL",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY",
    "externalCertificates": "POP",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 3,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - BLASTING",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO BLASTING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 4,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - COAL GETTING",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO COAL GETTING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 5,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - COAL PROCESSING PLANT",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO COAL PROCESSING PLANT",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 6,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - DEWATERING",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO DEWATERING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 7,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - DUMPING",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO DUMPING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 8,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - EKSPLORASI",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO EKSPLORASI",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 9,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - HAULING & ROAD MANAGEMENT",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO HAULING & ROAD MANAGEMENT",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 10,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - LAND CLEARING",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO LAND CLEARING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 11,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - LOADING MATERIAL LUNAK",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO LOADING MATERIAL LUNAK",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 12,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - MARINE DOZER",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MARINE DOZER",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 13,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - MARINE LOADER",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MARINE LOADER",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 14,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - MARINE PBM",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MARINE PBM",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 15,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - MARINE SURVEYOR",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MARINE SURVEYOR",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 16,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - MARINE PBO",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MARINE PBO",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 17,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - LIMBAH B3",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO LIMBAH B3",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 18,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - OB REMOVAL",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO OB REMOVAL",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 19,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - MAINTENANCE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MAINTENANCE",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 20,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS TEKNIS - PROJECT",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO PROJECT",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 21,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 2,
    "categoryNumber": 2,
    "category": "PENGAWAS OPERASIONAL INTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS - MINING EYES",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO OB REMOVAL, KPO HAULING ROAD MANAGEMENT, KPO MATERIAL LUNAK, KPO DUMPING, KPO DEWATERING, KPO COAL GETTING, KPO BLASTING, KPO MINING EYES",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 22,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 3,
    "category": "PENGAWAS OPERASIONAL EKSTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS - OPERASIONAL MADYA (POM)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI PENGAWAS OPERASIONAL MADYA (POM)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 23,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 3,
    "category": "PENGAWAS OPERASIONAL EKSTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS - OPERASIONAL PRATAMA (POP)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - PENGAWAS OPERASIONAL PRATAMA (POP)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 24,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 3,
    "category": "PENGAWAS OPERASIONAL EKSTERNAL (Jabatan Fungsional - Foreman Up)",
    "workPermitPosition": "PENGAWAS - OPERASIONAL UTAMA (POU)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - PENGAWAS OPERASIONAL UTAMA (POU)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 25,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 4,
    "category": "PENGAWAS TEKNIS",
    "workPermitPosition": "PENGAWAS - PETUGAS PEMERIKSA BIDANG BEJANA TEKAN DAN TANGKI TIMBUN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI TEKNISI/PETUGAS PEMERIKSA PENGUJI BIDANG BEJANA TEKAN DAN TANGKI TIMBUN",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 26,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 4,
    "category": "PENGAWAS TEKNIS",
    "workPermitPosition": "PENGAWAS - AHLI K3 PESAWAT TENAGA PRODUKSI",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 PESAWAT TENAGA PRODUKSI",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 27,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 4,
    "category": "PENGAWAS TEKNIS",
    "workPermitPosition": "PENGAWAS - SUPERVISOR PERANCAH",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI SUPERVISOR PERANCAH",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 28,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 4,
    "category": "PENGAWAS TEKNIS",
    "workPermitPosition": "PENGAWAS - RUANG TERBATAS",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI PETUGAS K3 MADYA RUANG TERBATAS",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 29,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / DRIVER - A2B",
    "employeeIdentity": "KARTU KELUARGA",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - OPERATOR A2B",
    "externalCertificates": "KEMENAKER - SERTIFIKAT OPERATOR A2B atau DEALER RESMI - SERTIFIKAT OPERATOR A2B Atau TRAINING CENTER PT BERAU COAL - SERTIFIKAT OPERATOR A2B (*TRAINING CENTER YANG SUDAH DITUNJUK KTT PT.BERAU COAL)",
    "healthRequirement": "FIT Untuk Bekerja Atau FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk SIMPER)",
    "location": ""
  },
  {
    "orderIndex": 30,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 3,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / DRIVER - HAULER",
    "employeeIdentity": "KARTU KELUARGA",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - ALAT ANGKUT (HAULER)",
    "externalCertificates": "BNSP - SERTIFIKAT ALAT ANGKUT (HAULER) atau DEALER - SERTIFIKAT ALAT ANGKUT (HAULER) atau TRAINING CENTER PT BERAU COAL - SERTIFIKAT ALAT ANGKUT (HAULER) (*TRAINING CENTER YANG SUDAH DITUNJUK KTT PT.BERAU COAL) | SIMPOL BII (Apabila Unit Hauler melintasi jalan negara)",
    "healthRequirement": "FIT Untuk Bekerja Atau FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk SIMPER)",
    "location": ""
  },
  {
    "orderIndex": 31,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / DRIVER - SARANA LV",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST",
    "internalCertificates": "KMKOP - DRIVER LIGHT VEHICLE (LV SARANA)",
    "externalCertificates": "SIMPOL A Up",
    "healthRequirement": "FIT Untuk Bekerja Atau FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk SIMPER)",
    "location": ""
  },
  {
    "orderIndex": 32,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / DRIVER - SARANA ANGKUTAN MASSAL (BUS, MAIN HAUL, MINI BUS)",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - DRIVER LIGHT VEHICLE (LV SARANA)",
    "externalCertificates": "SIMPOL B1 Up",
    "healthRequirement": "FIT Untuk Bekerja Atau FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk SIMPER)",
    "location": ""
  },
  {
    "orderIndex": 33,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / DRIVER - SARANA SUPPORT",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST",
    "internalCertificates": "KMKOP - DRIVER LIGHT VEHICLE (LV SARANA)",
    "externalCertificates": "SIMPOL A Up",
    "healthRequirement": "FIT Untuk Bekerja Atau FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk SIMPER)",
    "location": ""
  },
  {
    "orderIndex": 34,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / DRIVER - TRANSPORTASI AIR",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST",
    "internalCertificates": "KMKOP - IZIN BERKERJA DI DEKAT AIR",
    "externalCertificates": "SYAHBANDAR - SERTIFIKAT SURAT KOMPETENSI KECAKAPAN KELAUTAN",
    "healthRequirement": "FIT Untuk Bekerja Atau FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk SIMPER)",
    "location": ""
  },
  {
    "orderIndex": 35,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - MEKANIK & HELPER MEKANIK - PERMESINAN",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - IZIN BEKERJA DILUAR WORKSHOP (MECHANICK & HELPER MECHANIC), KMKOP - Dasar K3 Listrik",
    "externalCertificates": "Basic Mekanic Course (BMC)",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 36,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - Log Out Tag Out (LOTO)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BEKERJA DILUAR WORKSHOP (MECHANICK & HELPER MECHANIC)",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 37,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENGOPERASIAN ALAT LIFTING, RIGGING & SLINGING",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "Operator Pesawat Angkat & Angkut",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 38,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENGAMANAN PELEDAKAN & PENYUMBAT LUBANG LEDAK",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - PENGELOLAAN PELEDAKAN (KPP PRATAMA)",
    "externalCertificates": "KPP Madya",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 39,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - DIKETINGGIAN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BERKERJA DIKETINGGIAN",
    "externalCertificates": "KEMNAKER - SERTIFIKASI TENAGA KERJA PADA KETINGGIAN",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 40,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - DIRUANG TERBATAS",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BERKERJA PADA RUANG TERBATAS",
    "externalCertificates": "KEMNAKER - SERTIFIKASI PETUGAS K3 UTAMA RUANG TERBATAS",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 41,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - DIDEKAT AIR",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BERKERJA DI DEKAT AIR",
    "externalCertificates": "OPERATOR PENYALIRAN TAMBANG TERBUKA",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 42,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PEKERJAAN PANAS (LAS/LISTRIK)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BEKERJA PEKERJAAN PANAS",
    "externalCertificates": "KEMNAKER / BNSP - SERTIFIKASI JURU LAS",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 43,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 4,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PILOT DRONE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - PENGOPERASIAN UVS",
    "externalCertificates": "Sertifikat Remote Pilot Rating Pesawat Udara Kecil Tanpa Awak",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 44,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - HELPER BEKERJA DI DEKAT TAMAN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - BEKERJA AMAN AREA TAMAN / LANDSCAPE",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 45,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - LOGISTIC",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 46,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - K3 KONSTRUKSI",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "Sertifikasi Scaffolding",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 47,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - K3 EKSPLORASI",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - PEKERJA EKSPLORASI",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 48,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - K3 PIT & DISPOSAL",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 49,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - K3 OFFICE BOY & KANTIN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMPL - PEKERJA KANTOR & DAPUR",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 50,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - K3 OPERATOR TOWER LAMP / GENSET (AREA KEBISINGAN) KELAS 1 (>214,47 HP)",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - DASAR K3 LISTRIK, KMKOP - IZIN BEKERJA DILUAR WORKSHOP (MECHANICK & HELPER MECHANIC)",
    "externalCertificates": "KEMNAKER - SERTIFIKASI Operator K3 Motor Diesel Kelas 1 / >214,47 HP",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 51,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - K3 OPERATOR TOWER LAMP / GENSET (AREA KEBISINGAN) KELAS 2 (<214,47 HP)",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - DASAR K3 LISTRIK, KMKOP - IZIN BEKERJA DILUAR WORKSHOP (MECHANICK & HELPER MECHANIC)",
    "externalCertificates": "KEMNAKER - SERTIFIKASI Operator K3 Motor Diesel Kelas 2 / <214,47 HP",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 52,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENGENDALIAN BAHAN KIMIA BERBAHAYA / AHLI K3 KIMIA",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - Penanganan Hidrokarbon dan MSDS",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 KIMIA",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 53,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENGENDALIAN BAHAN KIMIA BERBAHAYA / PETUGAS K3 KIMIA",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - Penanganan Hidrokarbon dan MSDS",
    "externalCertificates": "KEMNAKER - SERTIFIKASI PETUGAS K3 KIMIA",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 54,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AHLI K3 LISTRIK (EXPERT)",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - DASAR K3 LISTRIK",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 LISTRIK",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 55,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AHLI K3 MUDA KONSTRUKSI (EXPERT) - Pengawas",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 MUDA KONSTRUKSI",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 56,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AHLI K3 MADYA KONSTRUKSI (EXPERT) - Pengawas",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 MADYA KONSTRUKSI",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 57,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AHLI K3 UTAMA KONSTRUKSI (EXPERT) - Pengawas",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 UTAMA KONSTRUKSI",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 58,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AMDAL A (DASAR-DASAR AMDAL)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KLHK - SERTIFIKASI AMDAL A DASAR-DASAR AMDAL",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 59,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AMDAL B (PENYUSUN AMDAL)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KLHK - SERTIFIKASI AMDAL B PENYUSUN AMDAL",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 60,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AMDAL C (PENILAI AMDAL)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KLHK - AMDAL C PENILAI AMDAL",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 61,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 5,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AUDITOR INTERNAL SMKP",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "ESDM - SERTIFIKASI AUDITOR INTERNAL SMKP",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 62,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - HIGIENE INDUSTRI MUDA",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI HIGIENE INDUSTRI MUDA",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 63,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - HIGIENE INDUSTRI MADYA",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - HIGIENE INDUSTRI MADYA",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 64,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - HIGIENE INDUSTRI UTAMA",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - HIGIENE INDUSTRI UTAMA",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 65,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - HIPERKES DOKTER",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - HIPERKES DOKTER",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 66,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - HIPERKES PARAMEDIK",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - HIPERKES PARAMEDIK",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 67,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - JURU IKAT (RIGGER)",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "KEMNAKER - JURU IKAT / RIGGER",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 68,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - JURU LEDAK KELAS 2 (KARTU IZIN MELEDAKAN)",
    "employeeIdentity": "",
    "license": "KIM",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI KURSUS JURU LEDAK (KJL) KELAS 2",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 69,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - JURU LEDAK KELAS 1",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI KURSUS JURU LEDAK (KJL) KELAS 1",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 70,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - JURU UKUR TAMBANG",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI - JURU UKUR TAMBANG",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 71,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR K3 PITA TRANSPORT / BELT CONVEYOR",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR K3 PITA TRANSPORT / BELT CONVEYOR",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 72,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR FORKLIFT KELAS 1 (25 ton - >100 ton dan menara 40m - >60m)",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR FORKLIFT KELAS 1",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 73,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR FORKLIFT KELAS 2 (25 ton - <100 ton dan menara 40m - 60m)",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR FORKLIFT KELAS 2",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 74,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 6,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR FORKLIFT KELAS 3 (<25 ton dan menara sampai 40m)",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "KEMNAKER - SERTIFIKASI FORKLIFT KELAS 3",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 75,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 7,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR MOBILE CRANE KELAS 1 (25 ton - >100 ton dan menara 40m - >60m)",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL, KMKOP - ALAT ANGKUT (Hauler)",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR K3 PESAWAT ANGKAT-ANGKUT : MOBILE CRANE KELAS 1",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 76,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 7,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR MOBILE CRANE KELAS 2 (25 ton - <100 ton dan menara 40m - 60m)",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL, KMKOP - ALAT ANGKUT (Hauler)",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR K3 PESAWAT ANGKAT-ANGKUT : MOBILE CRANE KELAS 2",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 77,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 7,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR MOBILE CRANE KELAS 3 (<25 ton dan menara sampai 40m)",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL, KMKOP - ALAT ANGKUT (Hauler)",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR K3 PESAWAT ANGKAT-ANGKUT : MOBILE CRANE KELAS 3",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 78,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 7,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR WHEEL LOADER / TP",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP - Operator A2B",
    "externalCertificates": "KEMENAKER - SERTIFIKAT OPERATOR A2B atau DEALER RESMI - SERTIFIKAT OPERATOR A2B Atau TRAINING CENTER PT BERAU COAL - SERTIFIKAT OPERATOR A2B (*TRAINING CENTER YANG SUDAH DITUNJUK KTT PT.BERAU COAL)",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 79,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 7,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR OVERHEAD CRANE KELAS 1 (25 ton - >100 ton dan menara 40m - >60m)",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR K3 PESAWAT ANGKAT ANGKUT : OVERHEAD CRANE KELAS 1",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 80,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 7,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR OVERHEAD CRANE KELAS 2 (25 ton - <100 ton dan menara 40m - 60m)",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR K3 PESAWAT ANGKAT ANGKUT : OVERHEAD CRANE KELAS 2",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 81,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 7,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR OVERHEAD CRANE KELAS 3 (<25 ton dan menara sampai 40m)",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "KEMNAKER - SERTIFIKASI OPERATOR K3 PESAWAT ANGKAT ANGKUT : OVERHEAD CRANE KELAS 3",
    "healthRequirement": "FIT Untuk Bekerja / FIT Untuk Bekerja Dengan Catatan (*Terdapat keterangan FTW untuk KIMPER)",
    "location": ""
  },
  {
    "orderIndex": 82,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENGAMBIL CONTOH UJI AIR",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI PENGAMBIL CONTOH UJI AIR",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 83,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENGELOLAAN LIMBAH B3",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI PENGELOLA LIMBAH B3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 84,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AHLI K3 PESAWAT TENAGA PRODUKSI",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 PESAWAT TENAGA PRODUKSI",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 85,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PETUGAS P3K (FIRST AID)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI PETUGAS P3K (FIRST AID)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 86,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENANGGUNG JAWAB PENGENDALI PENCEMARAN UDARA (PPPU)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "DLHK - SERTIFIKASI PENANGGUNGJAWAB PENGENDALIAN PENCEMARAN UDARA (PPPU)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 87,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENANGGUNG JAWAB PENGENDALI PENCEMARAN AIR (PPPA)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "DLHK - SERTIFIKASI PENANGGUNGJAWAB PENGENDALIAN PENCEMARAN AIR (PPPA)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 88,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENANGGUNG JAWAB OPERASI INSTALASI PENGENDALIAN PENCEMARAN UDARA (POIPPU)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "DLHK - SERTIFIKASI PENANGGUNGJAWAB OPERASI INSTALASI PENGENDALIAN PENCEMARAN UDARA (POIPPU)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 89,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PENANGGUNG JAWAB OPERASI PENGELOLAAN AIR LIMBAH (POPAL)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "DLHK - SERTIFIKASI PENANGGUNGJAWAB OPERASI PENGELOLAAN AIR LIMBAH (POPAL)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 90,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - TEKNISI PERANCAH",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI TEKNISI PERANCAH",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 91,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AHLI K3 UMUM",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 UMUM Atau BNSP - SERTIFIKASI AHLI K3 UMUM",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 92,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PETUGAS PENANGGULANGAN KEADAAN DARURAT",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "BNSP - SERTIFIKASI PETUGAS PENANGGULANGAN KEADAAN DARURAT",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 93,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - PETUGAS PERAN KEBAKARAN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 KEBAKARAN KELAS D",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 94,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - REGU PENANGGULANGAN KEBAKARAN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 KEBAKARAN KELAS C",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 95,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - KOORDINATOR UNIT PENANGGULANGAN KEBAKARAN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 KEBAKARAN KELAS B",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 96,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 8,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - AHLI SPESIALIS K3 KEBAKARAN",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "",
    "externalCertificates": "KEMNAKER - SERTIFIKASI AHLI K3 KEBAKARAN KELAS A",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 97,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / DRILLING",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP PEKERJA EKSPLORASI - DRILLING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 98,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / CHAINSAW MAN",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP LAND CLEARING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 99,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR / GEOPHYSICAL LOGGING",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP PEKERJA EKSPLORASI - GEOPHYSICAL LOGGING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 100,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - OPERATOR DOZING",
    "employeeIdentity": "",
    "license": "SIMPER FULL atau SIMPER PARTIAL atau SIMPER TEST atau SIMPER LEARNING 1 atau SIMPER LEARNING 2",
    "internalCertificates": "KMKOP PEKERJA EKSPLORASI - DOZING",
    "externalCertificates": "KEMENAKER - SERTIFIKAT OPERATOR A2B atau DEALER RESMI - SERTIFIKAT OPERATOR A2B Atau TRAINING CENTER PT BERAU COAL - SERTIFIKAT OPERATOR A2B (*TRAINING CENTER YANG SUDAH DITUNJUK KTT PT.BERAU COAL)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 101,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 5,
    "category": "TENAGA TEKNIS PERTAMBANGAN",
    "workPermitPosition": "PEKERJA - TEKNISI K3 LISTRIK",
    "employeeIdentity": "",
    "license": "KIMPER",
    "internalCertificates": "KMKOP - DASAR K3 LISTRIK",
    "externalCertificates": "KEMENAKER TEKNISI K3 LISTRIK",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 102,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB BEKERJA DENGAN PANAS",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MAINTENANCE, KMKOP - Izin Bekerja dengan Panas, KMKOP - Dasar K3 Listrik Pemenuhan",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 103,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB BEKERJA DENGAN PANAS",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - Izin Bekerja dengan Panas, KMKOP - Dasar K3 Listrik Pemenuhan",
    "externalCertificates": "Pengelasan (Welder)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 104,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB BEKERJA DI DEKAT AIR AREA TAMBANG",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO DEWATERING",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 105,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB BEKERJA DI DEKAT AIR AREA TAMBANG",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BERKERJA DI DEKAT AIR",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 106,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB BEKERJA DI DEKAT AIR AREA MARINE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KMKOP - IZIN BERKERJA DI DEKAT AIR",
    "externalCertificates": "Basic Safety Training (BST), Survival Crab Rescue Boat (SCRB), ANT 5 -1",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 107,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB BEKERJA DI DEKAT AIR AREA MARINE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BERKERJA DI DEKAT AIR",
    "externalCertificates": "Basic Safety Training (BST), Survival Crab Rescue Boat (SCRB)",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 108,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB DILUAR WORKSHOP",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MAINTENANCE, KMKOP - Dasar K3 Listrik",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 109,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB DILUAR WORKSHOP",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BEKERJA DILUAR WORKSHOP (MECHANICK & HELPER MECHANIC), KMKOP - Dasar K3 Listrik",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 110,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB KETINGGIAN - INFRASTRUKTUR",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO PROJECT",
    "externalCertificates": "Inspector Scaffolding, sertifikasi bangunan tingkat 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 111,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 9,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB - BEKERJA DI KETINGGIAN - INFRASTRUKTUR",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - Bekerja di Ketinggian",
    "externalCertificates": "Sertifikat Scaffolder, sertifikasi bangunan tingkat 1, 2, 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 112,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB KETINGGIAN - REPAIR/MAINTENANCE DI WORKSHOP/PIT",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MAINTENANCE",
    "externalCertificates": "Inspector Scaffolding, sertifikasi bangunan tingkat 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 113,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB KETINGGIAN - REPAIR/MAINTENANCE DI WORKSHOP/PIT",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - Bekerja di Ketinggian",
    "externalCertificates": "Sertifikat Scaffolder, sertifikasi bangunan tingkat 1, 2, 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 114,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB KETINGGIAN - EKSPLORASI",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO EKSPLORASI, KMKOP - Bekerja di Ketinggian",
    "externalCertificates": "Inspector Scaffolding, sertifikasi bangunan tingkat 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 115,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB KETINGGIAN - EKSPLORASI",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - Bekerja di Ketinggian",
    "externalCertificates": "Sertifikat Scaffolder, sertifikasi bangunan tingkat 1, 2, 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 116,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB KETINGGIAN - MARINE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KMKOP - Bekerja di Ketinggian",
    "externalCertificates": "Inspector Scaffolding, sertifikasi bangunan tingkat 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 117,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB KETINGGIAN - MARINE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - Bekerja di Ketinggian",
    "externalCertificates": "Sertifikat Scaffolder, sertifikasi bangunan tingkat 1, 2, 3",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 118,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB PENGANGKATAN DAN PENGANGKUTAN MATERIAL (IPPM)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 119,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB PENGANGKATAN DAN PENGANGKUTAN MATERIAL (IPPM)",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN PENGANGKATAN DAN PENGANGKUTAN MATERIAL",
    "externalCertificates": "Rigger, sertifikat alat untuk operator",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 120,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB AREA TERBATAS AREA TAMBANG",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KPO MAINTENANCE, KMKOP - IZIN BEKERJA PADA AREA TERBATAS",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 121,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB AREA TERBATAS AREA TAMBANG",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BEKERJA PADA AREA TERBATAS",
    "externalCertificates": "",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 122,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PENGAWAS - SIB AREA TERBATAS AREA MARINE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KPO SAFETY, KMKOP - IZIN BEKERJA PADA AREA TERBATAS",
    "externalCertificates": "Basic Safety Training (BST), Survival Crab Rescue Boat (SCRB), ANT 5 -1",
    "healthRequirement": "",
    "location": ""
  },
  {
    "orderIndex": 123,
    "documentNumber": "S-HCT-04.01",
    "revision": 3,
    "pageNumber": 10,
    "categoryNumber": 6,
    "category": "SIB MANAGEMENT",
    "workPermitPosition": "PEKERJA - SIB AREA TERBATAS AREA MARINE",
    "employeeIdentity": "",
    "license": "",
    "internalCertificates": "KMKOP - IZIN BEKERJA PADA AREA TERBATAS",
    "externalCertificates": "Basic Safety Training (BST), Survival Crab Rescue Boat (SCRB)",
    "healthRequirement": "",
    "location": ""
  }
]

APPLICATION_HEADERS = [
    "No",
    "Jenis Perizinan",
    "Persyaratan",
    "Masa Berlaku",
    "Halaman",
]

APPLICATION_ROWS = [
    [1, "ID CARD", "A. Baru: 1. Formulir Ijin Masuk Daerah Operasi (F-HCT-04.01); 2. Pas Foto 4x6 terbaru seragam kerja background putih; 3. E-KTP; 4. Kartu Keluarga (wajib untuk operator A2B & Hauler); 5. Surat Fit To Work (MCU) bertandatangan dokter dan stempel klinik; 6. Lulus Ujian KMPD. B. Perpanjangan: 1. Formulir F-HCT-04.01; 2. Lulus Ujian Kompetensi Refresh KMPD; 3. Surat Fit To Work terbaru bertandatangan dokter dan stempel klinik; 4. Data/Dokumen ID Card lama di sistem.", "Mengikuti MCU / ketentuan ID Card", 11],
    [2, "SIMPER TEST MEKANIK", "1. Form F-HCT-04.01; 2. KMKOP sesuai unit yang diajukan (Hauler / A2B); 3. Sertifikat unit & nilai Lulus; 4. Bukti Orientasi; 5. Surat Fit To Work Simper; 6. Kartu Keluarga.", "Mengikuti Fit to Work", 11],
    [3, "SIMPER L1 (TRAINER)", "1. Form F-HCT-04.01; 2. KMKOP sesuai unit Hauler / A2B; 3. Sertifikat TOT dari Lembaga Pemerintah; 4. Sertifikat unit & nilai Lulus; 5. Bukti Orientasi; 6. Surat Fit To Work Simper; 7. Kartu Keluarga.", "Mengikuti Fit to Work", 11],
    [4, "SIMPER L1 (Untuk Operator & Driver)", "1. Form F-HCT-04.01; 2. Surat Fit To Work SIMPER; 3. Jadwal pelaksanaan pelatihan (materi / praktik).", "1 bulan", 11],
    [5, "SIMPER L2 (Khusus Operator A2B & Hauler)", "1. Form F-HCT-04.01; 2. Form Permohonan Pelatihan Operator A2B F-HCT-02.01; 3. Hasil Inclass (S-HCT-02.01); 4. Hasil Praktek (S-HCT-02.01); 5. Bukti Orientasi Baru; 6. Sertifikat unit & nilai Lulus; 7. Surat Fit To Work; 8. SIMPER L1 aktif; 9. SIMPOL BII (jika melintasi jalan negara).", "Maksimal 8 bulan", 11],
    [6, "SIMPER L2 Ke Simper Full / Partial (Khusus Operator Hauler & A2B)", "1. Form F-HCT-04.01; 2. Hasil Evaluasi OJT terverifikasi HSECT Training; 3. Ceklist Permohonan Simper Full/Parsial New; 4. Bukti Orientasi terbaru; 5. Sertifikat unit & nilai Lulus; 6. Surat Fit To Work Simper; 7. SIMPOL BII (jika melintasi jalan negara).", "Mengikuti Fit to Work / SIMPOL (mana expired lebih dulu)", 12],
    [7, "SIMPER L2 (Khusus Kendaraan Massal BUS, ELF, MANHAUL)", "1. Form F-HCT-04.01; 2. Sertifikat unit & nilai Lulus / Hasil Praktek Simper; 3. Bukti Orientasi terbaru; 4. Surat Fit To Work Simper; 5. SIMPOL Minimal BI.", "Maksimal 3 bulan", 12],
    [8, "SIMPER L2 Ke Simper F/P (Khusus Kendaraan Massal BUS & ELF)", "1. Form F-HCT-04.01; 2. Hasil Evaluasi OJT terverifikasi HSECT Training; 3. Bukti Orientasi terbaru; 4. Sertifikat unit & nilai Lulus; 5. Surat Fit To Work Simper; 6. SIMPOL Minimal BI.", "Mengikuti Fit to Work / SIMPOL (mana expired lebih dulu)", 12],
    [9, "SIMPER FULL", "A. Baru (LV, Light Truck, Dump Truck PS 125-130): 1. Form F-HCT-04.01; 2. SIMPOL Minimal A; 3. Sertifikat unit & nilai Lulus; 4. Bukti Orientasi terbaru; 5. Surat Fit To Work Simper. B. Perpanjangan: 1. Form F-HCT-04.01; 2. Surat Fit To Work Simper; 3. SIMPER lama di sistem.", "Mengikuti Fit to Work / SIMPOL (mana expired lebih dulu)", 12],
    [10, "SIMPER FULL Khusus Transportasi Air", "1. Formulir F-HCT-04.01; 2. Sertifikat SKK dari Kementerian Perhubungan aktif; 3. Surat Fit To Work Simper.", "Mengikuti Fit to Work / Sertifikat SKK (mana expired lebih dulu)", 12],
    [11, "KIMPER Sementara", "1. Formulir F-HCT-04.01; 2. Fit to Work KIMPER; 3. Jadwal pelaksanaan pelatihan (materi / praktik).", "1 bulan", 13],
    [12, "KIMPER", "1. Form F-HCT-04.01; 2. Sertifikat Kompetensi mengikuti tabel Standar Working Permit; 3. Surat keterangan Kompeten dari PJO/Dept. Head PT BC (jika alat tidak disyaratkan regulasi); 4. Surat Fit To Work Kimper; 5. Untuk perpanjangan, data KIMPER tersimpan di sistem.", "Mengikuti Fit to Work", 13],
    [13, "TAC (Transhipment Access Card)", "1. Form F-HCT-04.01; 2. Surat Fit to Work (crew kapal tahun ganjil wajib Sertifikat Kesehatan Pelaut); 3. Sertifikat keterampilan khusus sesuai S-SHP-01.04; 4. Sertifikat Kompetensi TAC di Sintesis.", "Mengikuti Fit to Work", 13],
    [14, "Izin masuk Tamu", "1. Form F-HCT-04.01; 2. Formulir Induksi Tamu; 3. KTP/Paspor.", "Kunjungan tamu", 13],
    [15, "Izin masuk Tamu ke Marine / Transhipment Area", "1. Form F-HCT-04.01; 2. Formulir Induksi Tamu; 3. KTP/Paspor; 4. Surat Rekomendasi / Surat Tugas (teknisi perbaikan kapal wajib JSA & sertifikat relevan).", "Kunjungan tamu / tugas", 13],
    [16, "Supplier/Ekspedisi/Jasa angkutan", "1. Form F-HCT-04.01; 2. Formulir Induksi Tamu; 3. KTP/Paspor; 4. Copy STNK dan Pajak STNK masih berlaku.", "Sesuai masa tugas / pajak STNK", 13],
    [17, "KKPUVS", "A. Baru: 1. Formulir Pengajuan KKPUVS; 2. Sertifikat pelatihan kompetensi pengoperasian UVS. B. Perpanjangan: 1. Formulir KKPUVS; 2. KKPUVS pilot/operator lama; 3. Logbook pilot/operator.", "Sesuai ketentuan KKPUVS", 13],
    [18, "SID Hilang/Rusak", "1. Form F-HCT-04.01; 2. Berita Acara Kehilangan SID (F-HCT-04.04); 3. Data history ID Card lama.", "Mengikuti ID Card", 14],
    [19, "Re Aktifikasi SID yang Telah Melakukan Pelanggaran", "1. Form F-HCT-04.01; 2. Surat Permohonan Penonaktifan SID disetujui WKTT/PJK3; 3. Berita Acara dan Bukti Pelaksanaan Treatment.", "Setelah treatment selesai", 14],
]

INFO_ROWS = [
    ["Field", "Keterangan"],
    ["Sistem", "BERAU COAL GREEN MINING SYSTEM"],
    ["Jenis Dokumen", "STANDAR - Izin Bekerja di Daerah Operasi"],
    ["No. Dokumen", "S-HCT-04.01"],
    ["Tanggal Efektif", "26 Juli 2023"],
    ["Revisi", "3 (Formulir F-SMT-01.04 Revisi: 4)"],
    ["Dibuat Oleh", "Ongky Elisman (HSECT Manager)"],
    ["Diperiksa Oleh", "Febriwiadi Djali (System Compliance & Environment General Manager)"],
    ["Disetujui Oleh", "Feri Indrayana (Kepala Teknik Tambang - 26/07/2023)"],
    ["Kategori 1", "Karyawan: Seluruh karyawan yang bekerja di area operasional PT Berau Coal"],
    ["Kategori 2", "Pengawas Operasional Internal: Wajib memenuhi KPO Safety dan KPO Teknikal internal perusahaan"],
    ["Kategori 3", "Pengawas Operasional Eksternal: Wajib memiliki sertifikasi POP / POM / POU"],
    ["Kategori 4", "Pengawas Teknis: Ditunjuk KTT dan memiliki sertifikasi Kemnaker terkait keselamatan instalasi & peralatan"],
    ["Kategori 5", "Tenaga Teknis Pertambangan: Operator, mekanik, juru las, rigger, ahli K3, penyusun AMDAL, auditor SMKP, dll."],
    ["Kategori 6", "SIB Management: Pekerja & pengawas pada aktivitas dengan Surat Izin Bekerja (SIB)"],
]


def col_name(index: int) -> str:
    name = ""
    while index:
        index, rem = divmod(index - 1, 26)
        name = chr(65 + rem) + name
    return name


def cell_xml(row_idx: int, col_idx: int, value, style_id: int) -> str:
    ref = f"{col_name(col_idx)}{row_idx}"
    if value is None or value == "":
        return f"<c r=\"{ref}\" s=\"{style_id}\"/>"
    if isinstance(value, (int, float)):
        return f"<c r=\"{ref}\" s=\"{style_id}\"><v>{value}</v></c>"
    return f"<c r=\"{ref}\" t=\"inlineStr\" s=\"{style_id}\"><is><t>{html.escape(str(value))}</t></is></c>"


def worksheet_xml(rows: list[list], widths: list[int], freeze_header: bool = True, auto_filter_end_col: int | None = None) -> str:
    cols_xml = "".join(
        f"<col min=\"{i}\" max=\"{i}\" width=\"{width}\" customWidth=\"1\"/>"
        for i, width in enumerate(widths, start=1)
    )
    sheet_rows = []
    for r_idx, row in enumerate(rows, start=1):
        style_id = 1 if r_idx == 1 else 2
        row_attrs = " ht=\"26\" customHeight=\"1\"" if r_idx == 1 else ""
        cells = "".join(cell_xml(r_idx, c_idx, val, style_id) for c_idx, val in enumerate(row, start=1))
        sheet_rows.append(f"<row r=\"{r_idx}\"{row_attrs}>{cells}</row>")

    views_xml = (
        "<sheetViews><sheetView workbookViewId=\"0\">"
        + ("<pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\"/>" if freeze_header else "")
        + "</sheetView></sheetViews>"
    )
    filter_xml = (
        f"<autoFilter ref=\"A1:{col_name(auto_filter_end_col)}{len(rows)}\"/>"
        if auto_filter_end_col and len(rows) > 1
        else ""
    )

    sheet_data = "".join(sheet_rows)
    return (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" "
        "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">"
        f"{views_xml}"
        f"<cols>{cols_xml}</cols>"
        f"<sheetData>{sheet_data}</sheetData>"
        f"{filter_xml}"
        "</worksheet>"
    )


def styles_xml() -> str:
    return (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">"
        "<fonts count=\"2\">"
        "<font><sz val=\"10\"/><color rgb=\"FF0F172A\"/><name val=\"Calibri\"/></font>"
        "<font><b/><sz val=\"10\"/><color rgb=\"FFFFFFFF\"/><name val=\"Calibri\"/></font>"
        "</fonts>"
        "<fills count=\"3\">"
        "<fill><patternFill patternType=\"none\"/></fill>"
        "<fill><patternFill patternType=\"gray125\"/></fill>"
        "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF0F5132\"/></patternFill></fill>"
        "</fills>"
        "<borders count=\"2\">"
        "<border><left/><right/><top/><bottom/><diagonal/></border>"
        "<border>"
        "<left style=\"thin\"><color rgb=\"FFCBD5E1\"/></left>"
        "<right style=\"thin\"><color rgb=\"FFCBD5E1\"/></right>"
        "<top style=\"thin\"><color rgb=\"FFCBD5E1\"/></top>"
        "<bottom style=\"thin\"><color rgb=\"FFCBD5E1\"/></bottom>"
        "<diagonal/>"
        "</border>"
        "</borders>"
        "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>"
        "<cellXfs count=\"3\">"
        "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>"
        "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"2\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\">"
        "<alignment vertical=\"center\" wrapText=\"1\"/>"
        "</xf>"
        "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyBorder=\"1\" applyAlignment=\"1\">"
        "<alignment vertical=\"top\" wrapText=\"1\"/>"
        "</xf>"
        "</cellXfs>"
        "</styleSheet>"
    )


def build_xlsx(out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    matrix_table = [MATRIX_HEADERS] + [
        [
            row["orderIndex"],
            row["documentNumber"],
            row["revision"],
            row["pageNumber"],
            row["categoryNumber"],
            row["category"],
            row["workPermitPosition"],
            row["employeeIdentity"],
            row["license"],
            row["internalCertificates"],
            row["externalCertificates"],
            row["healthRequirement"],
            row["location"],
        ]
        for row in MATRIX_ROWS
    ]
    app_table = [APPLICATION_HEADERS] + APPLICATION_ROWS

    sheets = [
        ("Matriks_Working_Permit", worksheet_xml(matrix_table, [6, 14, 8, 10, 12, 34, 42, 22, 28, 42, 46, 36, 18], True, len(MATRIX_HEADERS))),
        ("Persyaratan_Pengajuan", worksheet_xml(app_table, [6, 36, 72, 34, 10], True, len(APPLICATION_HEADERS))),
        ("Info_Dokumen", worksheet_xml(INFO_ROWS, [24, 72], True, None)),
    ]

    content_types = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
        "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
        "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
        "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
        "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>"
        + "".join(
            f"<Override PartName=\"/xl/worksheets/sheet{i}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"
            for i in range(1, len(sheets) + 1)
        )
        + "</Types>"
    )
    root_rels = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>"
        "</Relationships>"
    )
    workbook_xml = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" "
        "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">"
        "<sheets>"
        + "".join(
            f"<sheet name=\"{html.escape(name)}\" sheetId=\"{i}\" r:id=\"rId{i}\"/>"
            for i, (name, _) in enumerate(sheets, start=1)
        )
        + "</sheets></workbook>"
    )
    workbook_rels = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
        + "".join(
            f"<Relationship Id=\"rId{i}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{i}.xml\"/>"
            for i in range(1, len(sheets) + 1)
        )
        + f"<Relationship Id=\"rId{len(sheets) + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>"
        + "</Relationships>"
    )

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", root_rels)
        zf.writestr("xl/workbook.xml", workbook_xml)
        zf.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        zf.writestr("xl/styles.xml", styles_xml())
        for i, (_, xml_body) in enumerate(sheets, start=1):
            zf.writestr(f"xl/worksheets/sheet{i}.xml", xml_body)

    print(f"Generated {out_path} ({len(MATRIX_ROWS)} matrix rows, {len(APPLICATION_ROWS)} application rows)")


if __name__ == "__main__":
    build_xlsx(OUT_PATH)
