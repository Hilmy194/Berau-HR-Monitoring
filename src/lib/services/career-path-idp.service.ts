import type { EditableLearningActivity } from "@/components/admin/learning-monitoring-editor";
import type { LearningActivityType } from "@/lib/services/learning-monitoring.service";

export interface CareerRotationPhase {
  phaseNumber: number;
  phaseTitle: string;
  targetDepartment: string;
  targetDivision: string;
  duration: string;
  projectAssignment: string;
  expectedDeliverable: string;
  mentorRole: string;
  focusCompetency: string;
}

export interface CareerPathSimulationData {
  targetPositionTitle: string;
  targetRoleRationale: string;
  rotationNeedLevel: "HIGH" | "MEDIUM" | "NORMAL";
  rotationNeedLabel: string;
  currentPositionDuration: string;
  tenureYears: number;
  stagnationAnalysis: string;
  careerHistorySummary: string[];
  crossFunctionalGaps: string[];
  scenarioTitle: string;
  totalDurationMonths: number;
  phases: CareerRotationPhase[];
  activities: EditableLearningActivity[];
}

export interface EmployeeProfileForCareerPath {
  profileId: string;
  name: string;
  currentPosition: string;
  department: string;
  division: string;
  directorate: string;
  currentPositionDuration?: string | null;
  lastPromotionDate?: string | null;
  joinDate?: string | null;
  careerHistory?: string[];
  aspiration?: string;
  isCandidate?: boolean;
}

/**
 * Menganalisis durasi masa jabatan dan mendeteksi apakah karyawan sudah lama di posisinya
 * (stuck / butuh rotasi lintas fungsi).
 */
export function analyzePositionTenure(
  durationStr?: string | null,
  lastPromotionDate?: string | null,
  joinDate?: string | null
): {
  durationText: string;
  tenureYears: number;
  rotationNeedLevel: "HIGH" | "MEDIUM" | "NORMAL";
  rotationNeedLabel: string;
  stagnationAnalysis: string;
} {
  let years = 0;
  let months = 0;

  if (durationStr && typeof durationStr === "string") {
    const yearMatch = durationStr.match(/(\d+)\s*(?:years|tahun|thn)/i);
    const monthMatch = durationStr.match(/(\d+)\s*(?:months|bulan|bln)/i);
    if (yearMatch) years = parseInt(yearMatch[1], 10);
    if (monthMatch) months = parseInt(monthMatch[1], 10);
  }

  // Jika durasi tidak eksplisit, hitung dari lastPromotionDate atau joinDate
  if (years === 0 && months === 0) {
    const refDateStr = lastPromotionDate || joinDate;
    if (refDateStr) {
      const refDate = new Date(refDateStr);
      if (!isNaN(refDate.getTime())) {
        // Asumsi referensi tahun berjalan operasional 2026
        const now = new Date("2026-11-23");
        const diffMonths = Math.max(
          1,
          (now.getFullYear() - refDate.getFullYear()) * 12 + (now.getMonth() - refDate.getMonth())
        );
        years = Math.floor(diffMonths / 12);
        months = diffMonths % 12;
      }
    }
  }

  // Default fallback jika data minim
  if (years === 0 && months === 0) {
    years = 2;
    months = 4;
  }

  const tenureYears = Number((years + months / 12).toFixed(1));
  const durationText = `${years} Tahun ${months} Bulan`;

  if (tenureYears >= 3.0) {
    return {
      durationText,
      tenureYears,
      rotationNeedLevel: "HIGH",
      rotationNeedLabel: "⚠️ Prioritas Rotasi (> 3 Thn di Posisi)",
      stagnationAnalysis: `Karyawan telah berada ${durationText} di posisi saat ini tanpa rotasi fungsi. Berisiko mengalami stagnasi kapabilitas dan kelelahan operasional (stuck). Sangat diprioritaskan untuk rotasi lintas fungsi guna membentuk kesiapan manajerial menyeluruh.`,
    };
  }

  if (tenureYears >= 2.0) {
    return {
      durationText,
      tenureYears,
      rotationNeedLevel: "MEDIUM",
      rotationNeedLabel: "🔄 Siap Rotasi Pengembangan (2–3 Thn)",
      stagnationAnalysis: `Karyawan telah berada ${durationText} di posisi saat ini. Berada di rentang waktu optimal untuk accelerated development lintas fungsi sebelum dipromosikan ke jenjang yang lebih tinggi.`,
    };
  }

  return {
    durationText,
    tenureYears,
    rotationNeedLevel: "NORMAL",
    rotationNeedLabel: "On-Track / Persiapan Rotasi",
    stagnationAnalysis: `Masa jabatan ${durationText}. Penguasaan teknis fungsi saat ini sedang diperdalam dan pemetaan rencana skenario rotasi lintas fungsi 2 tahun dapat dipersiapkan secara dini.`,
  };
}

/**
 * Membangun Skenario Simulasi Rotasi Lintas Fungsi 2 Tahun (Accelerated Development)
 * berbasis domain fungsi saat ini dan konteks industri pertambangan PT Berau Coal.
 */
export function buildCareerPathRotationPlan(
  emp: EmployeeProfileForCareerPath,
  targetPositionOverride?: string
): CareerPathSimulationData {
  const tenure = analyzePositionTenure(
    emp.currentPositionDuration,
    emp.lastPromotionDate,
    emp.joinDate
  );

  const pos = emp.currentPosition.toLowerCase();
  const dept = emp.department.toLowerCase();
  const div = emp.division.toLowerCase();

  // Bersihkan dan format ringkasan riwayat karir
  let careerHistorySummary: string[] = [];
  if (emp.careerHistory && emp.careerHistory.length > 0) {
    careerHistorySummary = emp.careerHistory.map((item) => item.trim()).filter(Boolean);
  } else {
    careerHistorySummary = [
      `Posisi Sekarang: ${emp.currentPosition} (${emp.department})`,
      `Rekam Jejak: Penugasan Spesialisasi Teknis & Operasional Tambang Berau Coal`,
    ];
  }

  let domain: "OPERATIONS" | "PLANNING" | "HSE" | "SUPPORT" = "OPERATIONS";
  if (
    pos.includes("plan") ||
    pos.includes("geolog") ||
    pos.includes("geotech") ||
    pos.includes("survey") ||
    dept.includes("plan") ||
    dept.includes("survey") ||
    div.includes("plan")
  ) {
    domain = "PLANNING";
  } else if (
    pos.includes("hse") ||
    pos.includes("safety") ||
    pos.includes("environ") ||
    pos.includes("k3") ||
    pos.includes("compliance") ||
    pos.includes("quality") ||
    dept.includes("compliance") ||
    dept.includes("safety") ||
    div.includes("compliance")
  ) {
    domain = "HSE";
  } else if (
    pos.includes("supply") ||
    pos.includes("procurement") ||
    pos.includes("hr") ||
    pos.includes("finance") ||
    pos.includes("legal") ||
    dept.includes("hr") ||
    dept.includes("finance")
  ) {
    domain = "SUPPORT";
  }

  // Tentukan Target Posisi Strategis
  let targetPositionTitle =
    targetPositionOverride ||
    (emp.isCandidate && emp.aspiration && emp.aspiration !== "-" ? emp.aspiration : "");

  if (!targetPositionTitle) {
    if (domain === "OPERATIONS") targetPositionTitle = "Mining Project Manager";
    else if (domain === "PLANNING") targetPositionTitle = "Mine Plan & Technical Services GM";
    else if (domain === "HSE") targetPositionTitle = "System Compliance & Environment GM";
    else targetPositionTitle = "Mining Operations Support General Manager";
  }

  let crossFunctionalGaps: string[] = [];
  let phases: CareerRotationPhase[] = [];
  let targetRoleRationale = "";

  if (domain === "OPERATIONS") {
    targetRoleRationale =
      "Sebagai kandidat Mining Project Manager, kelemahan umum suksesor pit tambang adalah minimnya jam terbang pemeliharaan armada alat berat (Plant) dan rantai pasok logistik bahan bakar / spare parts kritis. Skenario rotasi ini dirancang untuk menutup gap pengalaman tersebut selama 2 tahun.";
    crossFunctionalGaps = [
      "Kurang exposure pengelolaan Plant & Heavy Equipment Maintenance (Fleet Availability & Overhaul)",
      "Belum pernah memegang Supply Chain & Strategic Fuel/Material Logistics",
      "Perlu penguatan audit K3L & System Compliance lintas site tambang",
    ];
    phases = [
      {
        phaseNumber: 1,
        phaseTitle: "Tahap 1: Penguatan Asset Reliability & Plant Maintenance",
        targetDepartment: "Plant & Heavy Equipment Maintenance Dept",
        targetDivision: "Operations Support Division",
        duration: "8 Bulan",
        projectAssignment:
          "Implementasi Program Reliability Centered Maintenance (RCM) & Overhaul Scheduling Fleet Alat Berat Pit",
        expectedDeliverable:
          "Peningkatan Physical Availability (PA) armada hauler & loader mencapai 92% serta penurunan rata-rata Mean Time to Repair (MTTR) breakdown pit.",
        mentorRole: "Senior Manager Plant Services & Fleet Maintenance",
        focusCompetency: "Asset Reliability & Heavy Equipment Management",
      },
      {
        phaseNumber: 2,
        phaseTitle: "Tahap 2: Manajemen Rantai Pasok & Logistik BBM Tambang",
        targetDepartment: "Supply Chain, Fuel & Blasting Logistics Dept",
        targetDivision: "Supply Chain Management Division",
        duration: "8 Bulan",
        projectAssignment:
          "Optimasi Buffer Stock Spare Parts Kritis & Efisiensi Distribusi Logistik Pit-to-Port",
        expectedDeliverable:
          "Reduksi lead time pengadaan spare parts kritikal sebesar 25% dan zero fuel stockout operasional tambang.",
        mentorRole: "Head of Supply Chain & Material Management",
        focusCompetency: "Strategic Sourcing & End-to-End Mining Supply Chain",
      },
      {
        phaseNumber: 3,
        phaseTitle: "Tahap 3: Tata Kelola K3L, SMKP & Kepatuhan Lingkungan",
        targetDepartment: "HSE, Mine Closure & Compliance Dept",
        targetDivision: "System Compliance & Environment Division",
        duration: "8 Bulan",
        projectAssignment:
          "Audit Sistem Manajemen Keselamatan Pertambangan (SMKP) & Mitigasi Risiko Kritis Pit",
        expectedDeliverable:
          "Pencapaian Zero Lost Time Injury (LTI) pada pit rotasi dan standardisasi golden rules operasional kontraktor.",
        mentorRole: "GM System Compliance & Environment",
        focusCompetency: "Operational Risk Governance & Mining Safety Leadership",
      },
    ];
  } else if (domain === "PLANNING") {
    targetRoleRationale =
      "Sebagai calon pimpinan teknis tambang (GM Mine Plan / Project Manager), perencana tambang seringkali terisolasi dari eksekusi lapangan dan tantangan coal processing plant. Rotasi ini memberikan eksposur operasional nyata di front pit dan processing plant.";
    crossFunctionalGaps = [
      "Kurang exposure eksekusi langsung operasi pit dan shift management lapangan",
      "Belum pernah memegang Coal Processing Plant (CPP) & Quality Control",
      "Perlu penguatan pengelolaan kontraktor penambangan & cost control",
    ];
    phases = [
      {
        phaseNumber: 1,
        phaseTitle: "Tahap 1: Eksekusi Operasional Pit & Dispatch Control",
        targetDepartment: "Mine Production & Pit Control Dept",
        targetDivision: "Mine Operation Division",
        duration: "8 Bulan",
        projectAssignment:
          "Sinkronisasi Short-Term Mine Plan dengan Real-Time Dispatch Control Pit",
        expectedDeliverable:
          "Kepatuhan rencana tambang harian (compliance to plan) mencapai 95% dan minimasi deviasi stripping ratio.",
        mentorRole: "Mine Operation Manager & Senior Pit Superintendent",
        focusCompetency: "Pit Production Execution & Shift Coordination",
      },
      {
        phaseNumber: 2,
        phaseTitle: "Tahap 2: Pengolahan Batubara & Logistik Pelabuhan",
        targetDepartment: "Coal Processing & Port Logistics Dept",
        targetDivision: "Operation Support Division",
        duration: "8 Bulan",
        projectAssignment:
          "Pengurangan Batubara Terkontaminasi & Optimasi Throughput Coal Processing Plant (CPP)",
        expectedDeliverable:
          "Peningkatan yield batubara bersih 8% dan kelancaran flow barge loading terminal pelabuhan.",
        mentorRole: "Head of Coal Processing & Port Operations",
        focusCompetency: "Coal Quality Management & CPP Beneficiation",
      },
      {
        phaseNumber: 3,
        phaseTitle: "Tahap 3: Manajemen Kontrak & Pengendalian Biaya Tambang",
        targetDepartment: "Contractor Performance & Mine Cost Management Dept",
        targetDivision: "Finance & Business Support Division",
        duration: "8 Bulan",
        projectAssignment:
          "Audit Produktivitas & Cost Control Kontraktor Penambangan Utama",
        expectedDeliverable:
          "Efisiensi mining cash cost per ton sebesar $1.2/ton dan rekonsiliasi fuel burn rate kontraktor.",
        mentorRole: "Head of Planning, Budgeting & Contractor Control",
        focusCompetency: "Contractor Governance & Mining Financial Control",
      },
    ];
  } else if (domain === "HSE") {
    targetRoleRationale =
      "Kandidat suksesi HSE GM membutuhkan pemahaman mendalam tentang tekanan target produksi pit dan pemeliharaan infrastruktur sipil tambang agar penegakan safety tidak dilihat sebagai penghambat operasi, melainkan enabler produktivitas aman.";
    crossFunctionalGaps = [
      "Kurang exposure operasional pit tambang skala besar dan target produksi harian",
      "Belum pernah memegang pengelolaan fasilitas sipil penunjang tambang & hauling road",
      "Perlu penguatan tata kelola hubungan masyarakat lingkar tambang & external relations",
    ];
    phases = [
      {
        phaseNumber: 1,
        phaseTitle: "Tahap 1: Operasi Front Tambang & Kolaborasi Produksi",
        targetDepartment: "Mine Operation & Pit Services Dept",
        targetDivision: "Mine Operation Division",
        duration: "8 Bulan",
        projectAssignment:
          "Integrasi Safety Critical Controls ke dalam Daily Production Cycle di Front Tambang",
        expectedDeliverable:
          "Eliminasi near-miss berulang pada area pit aktif dan standardisasi handover shift K3L.",
        mentorRole: "Mine Operation General Manager",
        focusCompetency: "Operational Risk Management in High-Pressure Pit",
      },
      {
        phaseNumber: 2,
        phaseTitle: "Tahap 2: Infrastruktur Tambang, Hauling Road & Drainase",
        targetDepartment: "Civil, Road & Mine Infrastructure Maintenance Dept",
        targetDivision: "Operation Support Division",
        duration: "8 Bulan",
        projectAssignment:
          "Pengelolaan Sediment Pond, Runoff Water Management & Reklamasi Progresif Pit",
        expectedDeliverable:
          "Kepatuhan baku mutu air tambang 100% dan percepatan revegetasi lahan pascatambang seluas 45 Ha.",
        mentorRole: "Senior Manager Mine Infrastructure & Support",
        focusCompetency: "Environmental Engineering & Mine Civil Infrastructure",
      },
      {
        phaseNumber: 3,
        phaseTitle: "Tahap 3: Hubungan Eksternal, Komunitas & Manajemen Konflik",
        targetDepartment: "Community Development & External Relations Dept",
        targetDivision: "Legal & Corporate Affairs Division",
        duration: "8 Bulan",
        projectAssignment:
          "Pemberdayaan Masyarakat Lingkar Tambang & Manajemen Konflik Sosial Front Tambang",
        expectedDeliverable:
          "Penyelesaian isu sosial zero blockade dan implementasi CSR mandiri berkelanjutan.",
        mentorRole: "Head of Corporate Affairs & External Relations",
        focusCompetency: "Stakeholder Diplomacy & Social License to Operate",
      },
    ];
  } else {
    targetRoleRationale =
      "Kandidat fungsi pendukung membutuhkan immersion langsung ke denyut nadi operasi tambang batubara (site exposure) dan pengadaan strategis peralatan bernilai tinggi untuk memimpin direktorat operasional secara kredibel.";
    crossFunctionalGaps = [
      "Kurang jam terbang teknis di pit operasional tambang batubara",
      "Perlu pemahaman menyeluruh rantai pasok kontraktor alat berat dan logistik BBM tambang",
      "Perlu penguatan manajemen krisis operasional dan hubungan industrial site",
    ];
    phases = [
      {
        phaseNumber: 1,
        phaseTitle: "Tahap 1: Site Immersion & Frontline Operations",
        targetDepartment: "Mine Production Operations Field Office",
        targetDivision: "Mine Operation Division",
        duration: "8 Bulan",
        projectAssignment:
          "Executive Field Immersion & Operational Workflow Optimization",
        expectedDeliverable:
          "Penyusunan dashboard operasional pit terintegrasi dan efisiensi rotasi kru tambang.",
        mentorRole: "Mine Operation General Manager",
        focusCompetency: "Mining Operations Workflow & Field Awareness",
      },
      {
        phaseNumber: 2,
        phaseTitle: "Tahap 2: Pengadaan Strategis & Manajemen Kontrak Vendor",
        targetDepartment: "Procurement, Fuel & Heavy Equipment Contract Dept",
        targetDivision: "Supply Chain Management Division",
        duration: "8 Bulan",
        projectAssignment:
          "Strategic Sourcing & Vendor Service Level Agreement (SLA) Overhaul",
        expectedDeliverable:
          "Penghematan biaya kontrak pengadaan suku cadang kritis 12% dan SLA 95%.",
        mentorRole: "Division Head Supply Chain",
        focusCompetency: "Strategic Sourcing & Vendor Commercial Governance",
      },
      {
        phaseNumber: 3,
        phaseTitle: "Tahap 3: Hubungan Industrial Site & Manajemen Krisis",
        targetDepartment: "Industrial Relations & Site Human Capital Dept",
        targetDivision: "Human Capital Division",
        duration: "8 Bulan",
        projectAssignment:
          "Peningkatan Keterikatan Karyawan (Employee Engagement) & Harmoni Hubungan Industrial Site",
        expectedDeliverable:
          "Zero dispute ketenagakerjaan dan peningkatan retensi operator alat berat critical.",
        mentorRole: "Human Capital Director",
        focusCompetency: "Site Leadership & Industrial Relations Governance",
      },
    ];
  }

  // Bangun 3 Aktivitas IDP 70-20-10 untuk Career Path Rotasi Lintas Fungsi
  const p1 = phases[0];
  const p2 = phases[1];
  const p3 = phases[2];

  const activities: EditableLearningActivity[] = [
    {
      employeePersonnelNumber: emp.profileId,
      employeeName: emp.name,
      activityKey: "CAREER_ROTATION_70",
      activityType: "EXPERIENCE_70" as LearningActivityType,
      learningType: "70% Experience Learning",
      targetPosition: targetPositionTitle,
      skillImprovement: `Penugasan Rotasi Lintas Fungsi: ${p1.targetDepartment}`,
      programName: `Rotasi Lintas Fungsi Tahap 1 & 2: Memimpin proyek "${p1.projectAssignment}" di ${p1.targetDepartment} dilanjutkan penugasan "${p2.projectAssignment}" di ${p2.targetDepartment}`,
      provider: `Internal - Direktorat Operasional & Support Lintas Fungsi`,
      timeline: "16 bulan (2 siklus rotasi @ 8 bulan)",
      status: "IN_PROGRESS",
      successCriteria: `${p1.expectedDeliverable} Memperoleh rekomendasi kelayakan manajerial lintas fungsi dari Dept Head penerima rotasi.`,
      notes: "Skenario rotasi akselerasi 2 tahun hasil AI berdasarkan analisis durasi posisi dan career history.",
      version: 0,
    },
    {
      employeePersonnelNumber: emp.profileId,
      employeeName: emp.name,
      activityKey: "CAREER_ROTATION_20",
      activityType: "SOCIAL_20" as LearningActivityType,
      learningType: "20% Social Learning",
      targetPosition: targetPositionTitle,
      skillImprovement: "Executive Cross-Department Mentoring & Stakeholder Influence",
      programName: `Executive Mentoring Lintas Direktorat bersama ${p1.mentorRole} & ${p2.mentorRole} untuk transfer kapabilitas operasional dan supply chain`,
      provider: "Board of Management & Corporate Leadership Academy",
      timeline: "12 bulan",
      status: "IN_PROGRESS",
      successCriteria:
        "Minimal 12 sesi mentoring 1-on-1 dengan atasan lintas fungsi dan evaluasi kesiapan kepemimpinan holistik.",
      notes: "Pendampingan intensif oleh pimpinan divisi fungsi penerima rotasi.",
      version: 0,
    },
    {
      employeePersonnelNumber: emp.profileId,
      employeeName: emp.name,
      activityKey: "CAREER_ROTATION_10",
      activityType: "FORMAL_10" as LearningActivityType,
      learningType: "10% Formal Learning",
      targetPosition: targetPositionTitle,
      skillImprovement: "Sertifikasi Strategis Operasi Pertambangan Lintas Fungsi",
      programName: `Executive Accelerated Development: Sertifikasi Manajemen Operasi Pertambangan Terpadu, Asset Reliability & Supply Chain Strategy`,
      provider: "PPM Manajemen & Berau Coal Corporate University",
      timeline: "90 hari",
      status: "NOT_STARTED",
      successCriteria:
        "Kelulusan sertifikasi kompetensi lintas fungsi dan presentasi strategic paper di hadapan panel direksi.",
      notes: "Kurikulum terpadu pengayaan lintas fungsi.",
      version: 0,
    },
  ];

  return {
    targetPositionTitle,
    targetRoleRationale,
    rotationNeedLevel: tenure.rotationNeedLevel,
    rotationNeedLabel: tenure.rotationNeedLabel,
    currentPositionDuration: tenure.durationText,
    tenureYears: tenure.tenureYears,
    stagnationAnalysis: tenure.stagnationAnalysis,
    careerHistorySummary,
    crossFunctionalGaps,
    scenarioTitle: "Skenario Cross-Functional Rotation 2 Tahun (Accelerated Development)",
    totalDurationMonths: 24,
    phases,
    activities,
  };
}
