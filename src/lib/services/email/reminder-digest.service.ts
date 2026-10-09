import { sendHarmoniEmail } from "./email.service";
import { generateDigestHtml, ReminderItem } from "./reminder-templates";

export type MenuKey = "onboarding" | "od" | "talent" | "learning" | "retire";

interface PicConfig {
  name: string;
  email: string;
  role: string;
  menuTitle: string;
}

export function getPicConfigs(): Record<MenuKey, PicConfig> {
  return {
    onboarding: {
      name: process.env.PIC_NAME_ONBOARDING || "Aditya Subagyanto",
      email: process.env.PIC_EMAIL_ONBOARDING || "aditya@polteksimasberau.ac.id",
      role: "PIC Onboarding & Rekrutmen",
      menuTitle: "Onboarding & Rekrutmen",
    },
    od: {
      name: process.env.PIC_NAME_OD || "Anggi Rachmasari",
      email: process.env.PIC_EMAIL_OD || "anggi.rachmasari@beraucoalenergy.co.id",
      role: "PIC Organization Development",
      menuTitle: "Organization Development (OD)",
    },
    talent: {
      name: process.env.PIC_NAME_TALENT || "Merita",
      email: process.env.PIC_EMAIL_TALENT || "merita@mtl.co.id",
      role: "PIC Talent Management",
      menuTitle: "Talent Management",
    },
    learning: {
      name: process.env.PIC_NAME_LEARNING || "Irwansyah",
      email: process.env.PIC_EMAIL_LEARNING || "irwansyah@beraucoal.co.id",
      role: "PIC Learning & Development",
      menuTitle: "Learning & Development",
    },
    retire: {
      name: process.env.PIC_NAME_RETIRE || "Yoga",
      email: process.env.PIC_EMAIL_RETIRE || "yoga@beraucoal.co.id",
      role: "PIC Retirement & Offboarding",
      menuTitle: "Retirement & HC Operations",
    },
  };
}

export async function sendMenuDigestEmail(
  menuKey: MenuKey,
  targetEmailOverride?: string,
  options?: { onlyIfDueApproaching?: boolean }
) {
  const configs = getPicConfigs();
  const pic = configs[menuKey];
  if (!pic) throw new Error(`Unknown menu key: ${menuKey}`);

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
          description: "Kandidat posisi Mine Plan Engineer & HSE Officer belum mendapatkan update status kelulusan interview dari user.",
          urgency: "INFO",
          dueDate: "7 Hari Lalu",
          isDueDateApproaching: false,
          count: "3 Kandidat",
          actionUrl: `${baseUrl}/admin/recruitment`,
          actionText: "Buka Pipeline Rekrutmen",
        },
      ];
      break;

    case "od":
      stats = [
        { label: "Goal Setting Submit", value: "88%" },
        { label: "KPI At Risk", value: 7 },
        { label: "Pending Approval", value: 15 },
      ];
      allReminders = [
        {
          category: "Goal Setting / PTT",
          title: "Batas Akhir Submit & Approval Goal Setting Siklus Berjalan",
          description: "Terdapat 15 draft scorecard KPI karyawan yang masih berstatus pending review dan menunggu persetujuan atasan.",
          urgency: "HIGH",
          dueDate: "H-5 Hari",
          isDueDateApproaching: true,
          count: "15 Pending",
          actionUrl: `${baseUrl}/organization-development/goal-setting`,
          actionText: "Review Approval KPI",
        },
        {
          category: "Performance Monitoring",
          title: "7 KPI Departemen Terdeteksi 'At Risk / Overdue'",
          description: "Pencapaian milestone pada pilar Internal Business Process & Customer tertinggal di bawah batas toleransi kuartal.",
          urgency: "MEDIUM",
          dueDate: "Akhir Bulan Ini",
          isDueDateApproaching: true,
          count: "7 KPI",
          actionUrl: `${baseUrl}/organization-development`,
          actionText: "Lihat Detail KPI OD",
        },
      ];
      break;

    case "talent":
      stats = [
        { label: "Top Talent (9-Box)", value: 24 },
        { label: "High Flight Risk", value: 3 },
        { label: "Critical Vacancies", value: 2 },
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

    case "retire":
      stats = [
        { label: "Pra-Pensiun (H-1 Th)", value: 5 },
        { label: "Exit Clearance", value: 2 },
        { label: "Klaim DPLK Pending", value: 1 },
      ];
      allReminders = [
        {
          category: "Masa Persiapan Pensiun",
          title: "5 Karyawan Memasuki Masa Pra-Pensiun",
          description: "Perlu konfirmasi pendaftaran program pembekalan MPP (Masa Persiapan Pensiun) serta rencana serah terima tugas / transfer knowledge ke suksesor.",
          urgency: "HIGH",
          dueDate: "H-6 Bulan",
          isDueDateApproaching: true,
          count: "5 Karyawan",
          actionUrl: `${baseUrl}`,
          actionText: "Monitoring Pensiun",
        },
        {
          category: "Exit Clearance",
          title: "2 Karyawan Menuju Hari Terakhir Kerja",
          description: "Pengembalian aset laptop, ID card, dan serah terima dokumen operasional perlu diverifikasi sebelum tanggal efektif selesai.",
          urgency: "HIGH",
          dueDate: "H-3 Hari",
          isDueDateApproaching: true,
          count: "2 Karyawan",
          actionUrl: `${baseUrl}`,
          actionText: "Cek Checklist Clearance",
        },
      ];
      break;
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
  const menus: MenuKey[] = ["onboarding", "od", "talent", "learning", "retire"];
  const results: Record<string, any> = {};

  for (const menu of menus) {
    results[menu] = await sendMenuDigestEmail(menu, targetEmailOverride, options);
  }

  return results;
}

