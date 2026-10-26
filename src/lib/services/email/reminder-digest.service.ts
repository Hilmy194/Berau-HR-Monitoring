import { sendHarmoniEmail } from "./email.service";
import { generateDigestHtml, ReminderItem } from "./reminder-templates";
import { listRetirementMonitoring } from "../hr-modules.service";

export type MenuKey = "onboarding" | "od" | "talent" | "learning" | "retire" | "retire_bc" | "retire_mtl";

interface PicConfig {
  name: string;
  email: string;
  role: string;
  menuTitle: string;
  enabled?: boolean;
}

export function getPicConfigs(): Record<MenuKey, PicConfig> {
  return {
    onboarding: {
      name: process.env.PIC_NAME_ONBOARDING || "Aditya Subagyanto",
      email: process.env.PIC_EMAIL_ONBOARDING || "aditya@polteksimasberau.ac.id",
      role: "PIC Onboarding & Rekrutmen",
      menuTitle: "Onboarding & Rekrutmen",
      enabled: true,
    },
    od: {
      name: process.env.PIC_NAME_OD || "Anggi Rachmasari",
      email: process.env.PIC_EMAIL_OD || "anggi.rachmasari@beraucoalenergy.co.id",
      role: "PIC Organization Development",
      menuTitle: "Organization Development (OD)",
      enabled: true,
    },
    talent: {
      name: process.env.PIC_NAME_TALENT || "Merita",
      email: process.env.PIC_EMAIL_TALENT || "merita@mtl.co.id",
      role: "PIC Talent Management",
      menuTitle: "Talent Management",
      enabled: true,
    },
    learning: {
      name: process.env.PIC_NAME_LEARNING || "Irwansyah",
      email: process.env.PIC_EMAIL_LEARNING || "irwansyah@beraucoal.co.id",
      role: "PIC Learning & Development",
      menuTitle: "Learning & Development",
      // Reminder ke PIC Learning di-stop / belum dijalankan
      enabled: process.env.ENABLE_LEARNING_REMINDER === "true",
    },
    retire: {
      name: "Yoga (BC) & Rizal Habibi (MTL)",
      email: process.env.PIC_EMAIL_RETIRE || "yoga@beraucoal.co.id",
      role: "PIC Retirement",
      menuTitle: "Retirement & Workforce Transition",
      enabled: true,
    },
    retire_bc: {
      name: process.env.PIC_NAME_RETIRE_BC || process.env.PIC_NAME_RETIRE || "Yoga",
      email: process.env.PIC_EMAIL_RETIRE_BC || process.env.PIC_EMAIL_RETIRE || "yoga@beraucoal.co.id",
      role: "PIC Retirement Berau Coal",
      menuTitle: "Retirement Monitoring (Berau Coal)",
      enabled: true,
    },
    retire_mtl: {
      name: process.env.PIC_NAME_RETIRE_MTL || "Rizal Habibi",
      email: process.env.PIC_EMAIL_RETIRE_MTL || "rizal.habibi@mtl.co.id",
      role: "PIC Retirement MTL",
      menuTitle: "Retirement Monitoring (Mutiara Tanjung Lestari)",
      enabled: true,
    },
  };
}

export async function sendMenuDigestEmail(
  menuKey: MenuKey,
  targetEmailOverride?: string,
  options?: { onlyIfDueApproaching?: boolean }
): Promise<any> {
  // Jika memanggil grup "retire", jalankan pengiriman terpisah secara independen
  // Yoga hanya menerima rekap Berau Coal, dan Rizal Habibi hanya menerima rekap MTL
  if (menuKey === "retire") {
    const resBc = await sendMenuDigestEmail("retire_bc", targetEmailOverride, options);
    const resMtl = await sendMenuDigestEmail("retire_mtl", targetEmailOverride, options);
    return {
      success: Boolean(resBc.success && resMtl.success),
      menu: "retire",
      details: { bc: resBc, mtl: resMtl },
    };
  }

  const configs = getPicConfigs();
  const pic = configs[menuKey];
  if (!pic) throw new Error(`Unknown menu key: ${menuKey}`);

  // Cek jika reminder untuk modul ini di-stop / belum aktif (misal PIC Learning)
  if (pic.enabled === false) {
    console.log(`[Harmoni Email] Skipped ${menuKey} (${pic.name}): Reminder dinonaktifkan / di-stop dulu.`);
    return {
      success: true,
      skipped: true,
      reason: `Reminder untuk ${pic.menuTitle} (${pic.name}) sedang di-stop / belum dijalankan.`,
      menu: menuKey,
      pic: pic.name,
    };
  }

  const recipientEmail = targetEmailOverride || pic.email;
  const nowStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const baseUrl = process.env.APP_BASE_URL || "https://harmoni.beraucoal.co.id";
  let stats: { label: string; value: string | number }[] = [];
  let allReminders: ReminderItem[] = [];

  switch (menuKey) {
    case "onboarding":
      stats = [
        { label: "Active Probation", value: 12 },
        { label: "Sidang Mendekat (H-14)", value: 4 },
        { label: "SLA Candidate", value: "94%" },
      ];
      allReminders = [
        {
          category: "Probation & Presentasi",
          title: "4 Karyawan Menuju Jadwal Presentasi Akhir",
          description: "Masa probation karyawan Batch Q1 mendekati akhir. Mohon konfirmasi jadwal sidang presentasi dan undang tim panelis penguji.",
          urgency: "HIGH",
          dueDate: "H-14 Hari",
          isDueDateApproaching: true,
          count: "4 Orang",
          actionUrl: `${baseUrl}/recruitment/probation-monitoring`,
          actionText: "Lihat Jadwal Probation",
        },
        {
          category: "Evaluasi Pasca-Sidang",
          title: "2 Form Penilaian Presentasi Belum Disubmit Panelis",
          description: "Sidang probation telah selesai kemarin, menunggu finalisasi scoring evaluasi dari atasan langsung dan tim penguji.",
          urgency: "MEDIUM",
          dueDate: "Segera",
          isDueDateApproaching: true,
          count: "2 Pending",
          actionUrl: `${baseUrl}/admin/presentations`,
          actionText: "Buka Form Penilaian",
        },
        {
          category: "Workable Recruitment",
          title: "3 Kandidat Berstatus SLA Aging (> 7 Hari di Tahap Interview)",
          description: "Terdapat kandidat yang belum mendapat update status atau jadwal user interview lanjutan di sistem Workable.",
          urgency: "MEDIUM",
          dueDate: "Segera",
          isDueDateApproaching: true,
          count: "3 Kandidat",
          actionUrl: `${baseUrl}/recruitment`,
          actionText: "Cek Pipeline Workable",
        },
      ];
      break;

    case "od":
      stats = [
        { label: "Pending Approval", value: 3 },
        { label: "Open Organization", value: "98%" },
        { label: "Struktur Update", value: "Hari ini" },
      ];
      allReminders = [
        {
          category: "Struktur Organisasi",
          title: "Pembaruan Hierarki Pelaporan & Mapping Posisi Baru",
          description: "Verifikasi reporting line untuk penyesuaian posisi struktural dan pemegang jabatan terkini.",
          urgency: "MEDIUM",
          dueDate: "H-7 Hari",
          isDueDateApproaching: true,
          count: "3 Posisi",
          actionUrl: `${baseUrl}/organization-development/organization-structure`,
          actionText: "Lihat Struktur Organisasi",
        },
        {
          category: "Goal Setting / KPI",
          title: "Monitoring Pustaka KPI & Sasaran Kerja Karyawan",
          description: "Pastikan seluruh scorecard dan target level L1-L5 telah terdistribusi ke masing-masing divisi.",
          urgency: "INFO",
          dueDate: "Berkala",
          isDueDateApproaching: false,
          count: "Aktif",
          actionUrl: `${baseUrl}/organization-development/goal-setting/library`,
          actionText: "Buka Pustaka KPI",
        },
      ];
      break;

    case "talent":
      stats = [
        { label: "Critical Vacancies", value: 4 },
        { label: "Successor Ready", value: "78%" },
        { label: "High Flight Risk", value: 3 },
      ];
      allReminders = [
        {
          category: "Flight Risk Alert",
          title: "Peringatan Dini: 3 Top Talent Terdeteksi High Flight Risk",
          description: "Karyawan posisi Senior Engineer & Section Head memiliki skor retensi rendah. Perlu intervensi program retensi & diskusi 1-on-1 bersama atasan.",
          urgency: "HIGH",
          dueDate: "Perlu Tindakan",
          isDueDateApproaching: true,
          count: "3 Orang",
          actionUrl: `${baseUrl}/talent/talent-monitoring`,
          actionText: "Buka Talent Flight Risk",
        },
        {
          category: "Talent Committee",
          title: "Jadwal Sidang Kalibrasi Talent Matrix 9-Grid",
          description: "Undangan kalender dan bahan pertimbangan nominasi promosi telah disiapkan untuk jajaran pimpinan.",
          urgency: "MEDIUM",
          dueDate: "H-7 Hari",
          isDueDateApproaching: true,
          actionUrl: `${baseUrl}/talent`,
          actionText: "Buka Matriks Talent",
        },
      ];
      break;

    case "learning":
      stats = [
        { label: "Expiring Licenses", value: 9 },
        { label: "Mandatory Training", value: "91%" },
        { label: "CIP Projects", value: 6 },
      ];
      allReminders = [
        {
          category: "Sertifikasi K3 & Tambang",
          title: "9 Lisensi Wajib (POP / POM / SIMPER) Akan Expired",
          description: "Karyawan operasional lapangan wajib segera didaftarkan jadwal refresh training dan sertifikasi ulang BNSP/Kemenaker.",
          urgency: "HIGH",
          dueDate: "Dalam 30 Hari",
          isDueDateApproaching: true,
          count: "9 Sertifikasi",
          actionUrl: `${baseUrl}/admin/employee-management`,
          actionText: "Cek Daftar Lisensi",
        },
        {
          category: "Continuous Improvement",
          title: "Presentasi Milestone Proyek Inovasi CIP",
          description: "Jadwal showcase 6 proyek continuous improvement departemen operasional telah diagendakan bersama tim juri.",
          urgency: "MEDIUM",
          dueDate: "H-5 Hari",
          isDueDateApproaching: true,
          actionUrl: `${baseUrl}`,
          actionText: "Buka Detail CIP",
        },
      ];
      break;

    case "retire_bc": {
      // KHUSUS PIC BERAU COAL (Yoga): Hanya data karyawan Berau Coal, MTL TIDAK diikutsertakan
      const bcRows = (await listRetirementMonitoring({ businessUnit: "BERAU COAL" }))
        .filter((r) => (r.businessUnit || "").toUpperCase().includes("BERAU COAL") && !(r.businessUnit || "").toUpperCase().includes("MUTIARA TANJUNG LESTARI"));
      
      const urgent3m = bcRows.filter((r) => r.remainingDays >= 0 && r.remainingDays <= 90);
      const warning1y = bcRows.filter((r) => r.remainingDays > 90 && r.remainingDays <= 365);
      const extended = bcRows.filter((r) => r.isExtended);

      stats = [
        { label: "Pensiun < 3 Bln", value: `${urgent3m.length} Org` },
        { label: "Pra-Pensiun (1 Thn)", value: `${warning1y.length} Org` },
        { label: "Total Pipeline BC", value: `${bcRows.length} Org` },
      ];

      allReminders = [
        {
          category: "Pensiun Mendesak (< 3 Bulan) - Berau Coal",
          title: urgent3m.length > 0
            ? `${urgent3m.length} Karyawan Berau Coal Mendekati Tanggal Pensiun Efektif`
            : "Tidak Ada Karyawan Berau Coal Pensiun Mendesak (< 3 Bulan)",
          description: urgent3m.length > 0
            ? `Karyawan Berau Coal: ${urgent3m.slice(0, 3).map((r) => r.name).join(", ")}${urgent3m.length > 3 ? `, dan ${urgent3m.length - 3} lainnya` : ""}. Mohon verifikasi kesiapan berkas purna tugas, serah terima aset, atau proses perpanjangan kontrak (PKWT).`
            : "Jadwal pensiun karyawan Berau Coal terpantau aman dan belum ada yang jatuh tempo dalam 3 bulan ke depan.",
          urgency: urgent3m.length > 0 ? "HIGH" : "INFO",
          dueDate: "H-3 Bulan",
          isDueDateApproaching: urgent3m.length > 0,
          count: `${urgent3m.length} Karyawan`,
          actionUrl: `${baseUrl}/retire/retirement-monitoring?businessUnit=BERAU+COAL`,
          actionText: "Buka Monitoring Pensiun BC",
        },
        {
          category: "Masa Pra-Pensiun (H-1 Tahun) - Berau Coal",
          title: `${warning1y.length} Karyawan Berau Coal Memasuki Masa Pra-Pensiun`,
          description: "Perlu konfirmasi pendaftaran program pembekalan MPP (Masa Persiapan Pensiun) Berau Coal serta rencana transfer knowledge ke suksesor.",
          urgency: "MEDIUM",
          dueDate: "Dalam 1 Tahun",
          isDueDateApproaching: warning1y.length > 0,
          count: `${warning1y.length} Karyawan`,
          actionUrl: `${baseUrl}/retire/retirement-monitoring?businessUnit=BERAU+COAL`,
          actionText: "Buka Pra-Pensiun BC",
        },
      ];

      if (extended.length > 0) {
        allReminders.push({
          category: "Perpanjangan Kontrak Pensiun - Berau Coal",
          title: `${extended.length} Karyawan Berau Coal Berstatus Perpanjangan Kontrak`,
          description: "Monitoring batas akhir masa perpanjangan kontrak kerja pensiun Berau Coal dan pembaruan NIK baru.",
          urgency: "INFO",
          dueDate: "Berkala",
          isDueDateApproaching: false,
          count: `${extended.length} Karyawan`,
          actionUrl: `${baseUrl}/retire/retirement-monitoring?businessUnit=BERAU+COAL`,
          actionText: "Cek Kontrak Pensiun BC",
        });
      }
      break;
    }

    case "retire_mtl": {
      // KHUSUS PIC MTL (Rizal Habibi): Hanya data karyawan MTL, Berau Coal TIDAK diikutsertakan
      const mtlRows = (await listRetirementMonitoring({ businessUnit: "MUTIARA TANJUNG LESTARI" }))
        .filter((r) => (r.businessUnit || "").toUpperCase().includes("MUTIARA TANJUNG LESTARI") || (r.businessUnit || "").toUpperCase().includes("MTL"));
      
      const urgent3m = mtlRows.filter((r) => r.remainingDays >= 0 && r.remainingDays <= 90);
      const warning1y = mtlRows.filter((r) => r.remainingDays > 90 && r.remainingDays <= 365);
      const extended = mtlRows.filter((r) => r.isExtended);

      stats = [
        { label: "Pensiun < 3 Bln", value: `${urgent3m.length} Org` },
        { label: "Pra-Pensiun (1 Thn)", value: `${warning1y.length} Org` },
        { label: "Total Pipeline MTL", value: `${mtlRows.length} Org` },
      ];

      allReminders = [
        {
          category: "Pensiun Mendesak (< 3 Bulan) - MTL",
          title: urgent3m.length > 0
            ? `${urgent3m.length} Karyawan MTL Mendekati Tanggal Pensiun Efektif`
            : "Tidak Ada Karyawan MTL Pensiun Mendesak (< 3 Bulan)",
          description: urgent3m.length > 0
            ? `Karyawan MTL: ${urgent3m.slice(0, 3).map((r) => r.name).join(", ")}${urgent3m.length > 3 ? `, dan ${urgent3m.length - 3} lainnya` : ""}. Mohon verifikasi kesiapan berkas purna tugas, serah terima aset, atau proses perpanjangan kontrak (PKWT).`
            : "Jadwal pensiun karyawan MTL terpantau aman dan belum ada yang jatuh tempo dalam 3 bulan ke depan.",
          urgency: urgent3m.length > 0 ? "HIGH" : "INFO",
          dueDate: "H-3 Bulan",
          isDueDateApproaching: urgent3m.length > 0,
          count: `${urgent3m.length} Karyawan`,
          actionUrl: `${baseUrl}/retire/retirement-monitoring?businessUnit=MUTIARA+TANJUNG+LESTARI`,
          actionText: "Buka Monitoring Pensiun MTL",
        },
        {
          category: "Masa Pra-Pensiun (H-1 Tahun) - MTL",
          title: `${warning1y.length} Karyawan MTL Memasuki Masa Pra-Pensiun`,
          description: "Perlu konfirmasi pendaftaran program pembekalan MPP (Masa Persiapan Pensiun) MTL serta rencana transfer knowledge ke suksesor.",
          urgency: "MEDIUM",
          dueDate: "Dalam 1 Tahun",
          isDueDateApproaching: warning1y.length > 0,
          count: `${warning1y.length} Karyawan`,
          actionUrl: `${baseUrl}/retire/retirement-monitoring?businessUnit=MUTIARA+TANJUNG+LESTARI`,
          actionText: "Buka Pra-Pensiun MTL",
        },
      ];

      if (extended.length > 0) {
        allReminders.push({
          category: "Perpanjangan Kontrak Pensiun - MTL",
          title: `${extended.length} Karyawan MTL Berstatus Perpanjangan Kontrak`,
          description: "Monitoring batas akhir masa perpanjangan kontrak kerja pensiun MTL dan pembaruan NIK baru.",
          urgency: "INFO",
          dueDate: "Berkala",
          isDueDateApproaching: false,
          count: `${extended.length} Karyawan`,
          actionUrl: `${baseUrl}/retire/retirement-monitoring?businessUnit=MUTIARA+TANJUNG+LESTARI`,
          actionText: "Cek Kontrak Pensiun MTL",
        });
      }
      break;
    }
  }

  // Filter ONLY approaching due dates / urgent action items
  const activeReminders = allReminders.filter((r) => r.isDueDateApproaching);

  // If strict filtering is requested and there are no approaching due dates, skip sending
  if (options?.onlyIfDueApproaching !== false && activeReminders.length === 0) {
    console.log(`[Harmoni Email] Skipped ${menuKey} (${pic.name}): No approaching due dates.`);
    return {
      success: true,
      skipped: true,
      reason: "No approaching due dates found for this menu.",
      menu: menuKey,
      pic: pic.name,
    };
  }

  const html = generateDigestHtml({
    picName: pic.name,
    picRole: pic.role,
    menuTitle: pic.menuTitle,
    reportDate: nowStr,
    summaryStats: stats,
    reminders: activeReminders,
  });

  return await sendHarmoniEmail({
    to: recipientEmail,
    subject: `[Harmoni Urgent/Due Reminder] ${pic.menuTitle} - Rekap Tenggat Waktu (${nowStr})`,
    html,
  });
}

export async function sendAllMenuDigests(
  targetEmailOverride?: string,
  options?: { onlyIfDueApproaching?: boolean }
) {
  const configs = getPicConfigs();
  // Mengirim ke seluruh PIC: Onboarding, OD, Talent, Retire BC (Yoga), Retire MTL (Rizal Habibi)
  const menus: MenuKey[] = (["onboarding", "od", "talent", "retire_bc", "retire_mtl"] as MenuKey[]).filter(
    (m) => configs[m]?.enabled !== false
  );
  if (configs["learning"]?.enabled) {
    menus.push("learning");
  }
  const results: Record<string, any> = {};

  for (const menu of menus) {
    results[menu] = await sendMenuDigestEmail(menu, targetEmailOverride, options);
  }

  return results;
}
