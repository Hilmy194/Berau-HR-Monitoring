"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface EmployeeCardPdfData {
  name: string;
  nik: string;
  email: string;
  phone: string;
  position: string;
  currentPositionDuration: string;
  jobLevel: string;
  businessUnit: string;
  department: string;
  joinDate: string;
  supervisorName: string;
  workLocation: string;
  currentRole: string;
  talentClass: string;
  education: string;
  fastTrack: string;
  buVisibility: string;
  softCompetencies: Array<{
    name: string;
    profId: number;
    profDesc?: string;
    idealLevel?: number | null;
  }>;
  softAverage: number;
  technicalCompetencies: Array<{
    name: string;
    profId: number;
    profDesc?: string;
    idealLevel?: number | null;
  }>;
  technicalAverage: number;
  careerHistory: Array<{ title: string; period?: string }>;
  aspirations: Array<{ content: string; dateStr?: string }>;
  projectContribution: string;
  projectImpact: string;
  projects: Array<{ title: string; date?: string }>;
  certifications: Array<{ title: string; subtitle?: string }>;
  assessment: {
    iq: string;
    iqCategory: string;
    disc: string;
    discCategory: string;
    matchupResult: string;
  };
  hse: {
    mcu: string;
    sid: string;
    simper: string;
    summary: string;
  };
  strengthText: string;
  weaknessText: string;
  performance: {
    y2025: string;
    y2024: string;
    y2023: string;
  };
  comments360: Array<{ date?: string; text: string }>;
  summary360: string;
  currentYear: number;
  aiInsight?: {
    readinessLabel: string;
    summary: string;
    strengths: string[];
    prioritySkillGaps: Array<{ skillName: string; gap?: number; evidenceSummary?: string }>;
    developmentRecommendations: Array<{ title: string; description?: string }>;
    idpSeventy: string[];
    idpTwenty: string[];
    idpTen: string[];
  } | null;
}

export function EmployeeCardPdfButton({ data }: { data: EmployeeCardPdfData }) {
  const [generating, setGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const bottomLimit = pageHeight - 14;

      let y = 0;

      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight > bottomLimit) {
          doc.addPage();
          y = 14;
        }
      };

      const cleanText = (val?: string | number | null, fallback = "-") => {
        const s = String(val ?? "")
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2013\u2014]/g, "-")
          .replace(/\u2022/g, "-")
          .replace(/\u00B0/g, " deg")
          .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return s || fallback;
      };

      const drawSectionHeader = (title: string, subtitle?: string) => {
        ensureSpace(13);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, "F");
        doc.setFillColor(47, 143, 34);
        doc.rect(margin, y, 2.2, 7.5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(cleanText(title), margin + 4.5, y + 5);

        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(cleanText(subtitle), pageWidth - margin - 2, y + 5, { align: "right" });
        }
        y += 10;
      };

      const drawKeyValueGrid = (items: Array<{ label: string; value: string }>, cols = 2) => {
        const gap = 4;
        const colW = (contentWidth - gap * (cols - 1)) / cols;

        for (let i = 0; i < items.length; i += cols) {
          const slice = items.slice(i, i + cols);
          const wrappedCells = slice.map((item) => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            const lines = doc.splitTextToSize(cleanText(item.value), colW - 5) as string[];
            return { ...item, lines };
          });
          const maxLines = Math.max(...wrappedCells.map((c) => c.lines.length), 1);
          const boxHeight = 6.5 + maxLines * 3.9;
          ensureSpace(boxHeight + 2);

          wrappedCells.forEach((cell, idx) => {
            const x = margin + idx * (colW + gap);
            doc.setFillColor(250, 251, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(x, y, colW, boxHeight, 1.2, 1.2, "FD");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(cleanText(cell.label).toUpperCase(), x + 2.5, y + 4);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            doc.text(cell.lines, x + 2.5, y + 8.2);
          });

          y += boxHeight + 2.2;
        }
        y += 1.5;
      };

      const drawBulletList = (heading: string, rows: Array<{ primary: string; secondary?: string }>, emptyMsg: string) => {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(cleanText(heading), margin, y);
        y += 4.2;

        if (!rows.length) {
          ensureSpace(6);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(cleanText(emptyMsg), margin + 2, y);
          y += 5;
          return;
        }

        for (const row of rows) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.2);
          const pLines = doc.splitTextToSize(`- ${cleanText(row.primary)}`, contentWidth - 4) as string[];
          const sLines = row.secondary
            ? (doc.splitTextToSize(`  ${cleanText(row.secondary)}`, contentWidth - 6) as string[])
            : [];
          const needed = pLines.length * 3.8 + sLines.length * 3.4 + 1.8;
          ensureSpace(needed);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.2);
          doc.setTextColor(15, 23, 42);
          doc.text(pLines, margin + 1, y);
          y += pLines.length * 3.8;

          if (sLines.length) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.6);
            doc.setTextColor(100, 116, 139);
            doc.text(sLines, margin + 2, y);
            y += sLines.length * 3.4;
          }
          y += 1.4;
        }
        y += 1.5;
      };

      const drawCompetencyTable = (
        label: string,
        avg: number,
        items: EmployeeCardPdfData["softCompetencies"]
      ) => {
        ensureSpace(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`${cleanText(label)} (${items.length} items - Rata-rata: ${avg} / 5.0)`, margin, y);
        y += 4;

        if (!items.length) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("Belum ada data kompetensi dari SAP", margin + 2, y);
          y += 6;
          return;
        }

        // Table Header
        ensureSpace(7);
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, y, contentWidth, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Nama Kompetensi", margin + 3, y + 4.1);
        doc.text("Aktual", margin + contentWidth - 42, y + 4.1);
        doc.text("Ideal", margin + contentWidth - 20, y + 4.1);
        y += 6;

        items.forEach((item, idx) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const nameLines = doc.splitTextToSize(cleanText(item.name), contentWidth - 52) as string[];
          const rowH = Math.max(5.5, nameLines.length * 3.8 + 1.8);
          ensureSpace(rowH);

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, rowH, "F");
          }
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y + rowH, margin + contentWidth, y + rowH);

          doc.setTextColor(15, 23, 42);
          doc.text(nameLines, margin + 3, y + 4);
          doc.setFont("helvetica", "bold");
          doc.text(`Level ${item.profId}`, margin + contentWidth - 42, y + 4);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          doc.text(
            item.idealLevel ? `Level ${item.idealLevel}` : "-",
            margin + contentWidth - 20,
            y + 4
          );
          y += rowH;
        });
        y += 4;
      };

      // ================= PAGE 1 HEADER BANNER =================
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 34, "F");
      doc.setFillColor(47, 143, 34);
      doc.rect(0, 32.5, pageWidth, 1.5, "F");

      doc.setTextColor(109, 209, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TALENT / EMPLOYEE CARD - PT BERAU COAL", margin, 10);

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(cleanText(data.name), margin, 18.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `${cleanText(data.position)}  |  NIK: ${cleanText(data.nik)}  |  ${cleanText(data.businessUnit)}`,
        margin,
        25.5
      );

      const generatedAt = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Dicetak: ${generatedAt}`, pageWidth - margin, 10, { align: "right" });

      y = 40;

      // 1. Profil Karyawan
      drawSectionHeader("1. Profil Karyawan", "Data Master & Kontak");
      drawKeyValueGrid([
        { label: "Current Position", value: data.position },
        { label: "Current Position Duration", value: data.currentPositionDuration },
        { label: "Job Level", value: data.jobLevel },
        { label: "Business Unit", value: data.businessUnit },
        { label: "Department", value: data.department },
        { label: "Join Date", value: data.joinDate },
        { label: "Supervisor", value: data.supervisorName },
        { label: "Work Location", value: data.workLocation },
        { label: "Phone / Cellphone", value: data.phone },
        { label: "Email", value: data.email },
      ]);

      // 2. Capability & Talent Profile
      drawSectionHeader("2. Capability & Talent Profile", "BigQuery - Terkini");
      drawKeyValueGrid([
        { label: "Current Role", value: data.currentRole },
        { label: "Talent Class", value: data.talentClass },
        { label: "Education", value: data.education },
        { label: "Fast Track", value: data.fastTrack },
      ]);
      drawKeyValueGrid([{ label: "BU Visibility Scale", value: data.buVisibility }], 1);

      // 3. Competency Scale
      drawSectionHeader("3. Competency Scale (SAP)", "Siklus 1-2 Tahun");
      drawCompetencyTable("Soft Competencies Scale", data.softAverage, data.softCompetencies);
      drawCompetencyTable("Technical Competency Scale", data.technicalAverage, data.technicalCompetencies);

      // 4. Career & Aspiration
      drawSectionHeader("4. Career History & Aspiration", "BigQuery / MyAgility");
      drawBulletList(
        "Career & Experience",
        data.careerHistory.map((c) => ({ primary: c.title, secondary: c.period })),
        "Belum tersedia dari SAP"
      );
      drawBulletList(
        "Career Aspiration (MyAgility - 3 Entri Terbaru)",
        data.aspirations.map((a) => ({ primary: a.content, secondary: a.dateStr })),
        "Belum tersedia dari SAP / MyAgility"
      );

      // 5. Project Assignment & Certification
      drawSectionHeader("5. Project Assignment & Certification", "3 Tahun Terakhir");
      drawKeyValueGrid([
        { label: "Project Contribution", value: data.projectContribution },
        { label: "Project Impact", value: data.projectImpact },
      ]);
      drawBulletList(
        "Project Involvement",
        data.projects.map((p) => ({ primary: p.title, secondary: p.date })),
        "Belum tersedia dari SAP"
      );
      drawBulletList(
        "Certification",
        data.certifications.map((c) => ({ primary: c.title, secondary: c.subtitle })),
        "Belum diisi"
      );

      // 6. Assessment & HSE-CT
      drawSectionHeader("6. Assessment & HSE-CT", "Assessment Center & Medical/HSE");
      drawKeyValueGrid([
        { label: "IQ Score", value: data.assessment.iq },
        { label: "IQ Category", value: data.assessment.iqCategory },
        { label: "DISC", value: data.assessment.disc },
        { label: "DISC Category", value: data.assessment.discCategory },
      ]);
      drawKeyValueGrid([{ label: "Matchup Result", value: data.assessment.matchupResult }], 1);
      drawKeyValueGrid(
        [
          { label: "MCU", value: data.hse.mcu },
          { label: "SID", value: data.hse.sid },
          { label: "SIMPER", value: data.hse.simper },
        ],
        3
      );
      drawKeyValueGrid([{ label: "HSE CT Summary", value: data.hse.summary }], 1);

      // 7. Strength, Weakness & Performance
      drawSectionHeader("7. Performance Profile & 360 Review", `Tahun ${data.currentYear}`);
      drawKeyValueGrid(
        [
          { label: "Performance 2025", value: data.performance.y2025 },
          { label: "Performance 2024", value: data.performance.y2024 },
          { label: "Performance 2023", value: data.performance.y2023 },
        ],
        3
      );
      drawKeyValueGrid(
        [
          { label: `Strength (${data.currentYear})`, value: data.strengthText },
          { label: `Weakness (${data.currentYear})`, value: data.weaknessText },
        ],
        2
      );
      drawKeyValueGrid([{ label: `Ringkasan Evaluasi 360 (${data.currentYear})`, value: data.summary360 }], 1);
      if (data.comments360.length) {
        drawBulletList(
          `Komentar 360 Terkurasi (${data.comments360.length})`,
          data.comments360.map((c) => ({ primary: c.text, secondary: c.date })),
          "Belum ada komentar"
        );
      }

      // 8. AI Insight & IDP (Optional)
      if (data.aiInsight) {
        drawSectionHeader("8. AI Insight & IDP 70-20-10", data.aiInsight.readinessLabel);
        drawKeyValueGrid([{ label: "Executive Readiness Summary", value: data.aiInsight.summary }], 1);
        drawBulletList(
          "Priority Skill Gaps",
          data.aiInsight.prioritySkillGaps.map((g) => ({
            primary: `${g.skillName}${g.gap !== undefined ? ` (Gap ${g.gap})` : ""}`,
            secondary: g.evidenceSummary,
          })),
          "Belum ada catatan skill gap"
        );
        drawBulletList(
          "70% On-The-Job Action",
          data.aiInsight.idpSeventy.map((item) => ({ primary: item })),
          "Belum ada aksi 70%"
        );
        drawBulletList(
          "20% Coaching & Mentoring",
          data.aiInsight.idpTwenty.map((item) => ({ primary: item })),
          "Belum ada aksi 20%"
        );
        drawBulletList(
          "10% Structured Learning",
          data.aiInsight.idpTen.map((item) => ({ primary: item })),
          "Belum ada aksi 10%"
        );
      }

      // Page numbers footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Harmoni HR Monitoring - Employee Card (${cleanText(data.name)})`,
          margin,
          pageHeight - 5.5
        );
        doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, pageHeight - 5.5, {
          align: "right",
        });
      }

      const safeFileName = cleanText(data.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const safeNik = cleanText(data.nik).replace(/[^a-zA-Z0-9_-]/g, "");
      doc.save(`Employee-Card-${safeNik}-${safeFileName || "karyawan"}.pdf`);
      toast.success("Employee Card PDF berhasil diunduh");
    } catch (error) {
      console.error("[EMPLOYEE_CARD_PDF_ERROR]", error);
      toast.error("Gagal membuat PDF Employee Card");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleDownloadPdf}
      disabled={generating}
      className="gap-2 rounded-full bg-slate-950 text-white hover:bg-slate-800 shadow-sm"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      {generating ? "Mengunduh PDF..." : "Print / Download PDF"}
      {!generating && <Download className="h-3.5 w-3.5 opacity-80" />}
    </Button>
  );
}
