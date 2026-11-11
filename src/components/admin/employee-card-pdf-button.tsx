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

async function loadImageWithAspect(
  src: string
): Promise<{ dataUrl: string; aspect: number } | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const aspect = await new Promise<number>((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve(
          img.naturalWidth && img.naturalHeight
            ? img.naturalWidth / img.naturalHeight
            : 1
        );
      img.onerror = () => resolve(1);
      img.src = dataUrl;
    });
    return { dataUrl, aspect };
  } catch {
    return null;
  }
}

export function EmployeeCardPdfButton({ data }: { data: EmployeeCardPdfData }) {
  const [generating, setGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const [{ jsPDF }, berauLogo, harmoniLogo] = await Promise.all([
        import("jspdf"),
        loadImageWithAspect("/BERAU-LOGO.png"),
        loadImageWithAspect("/harmoni-logo-with-script-fit.png"),
      ]);

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      const bottomLimit = pageHeight - 16;

      let y = 0;

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

      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight > bottomLimit) {
          doc.addPage();
          y = 18;
        }
      };

      const drawSectionHeader = (title: string, subtitle?: string) => {
        ensureSpace(12);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, 7, "FD");
        doc.setFillColor(47, 143, 34); // Berau Coal Green accent bar
        doc.rect(margin, y, 2.2, 7, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.2);
        doc.setTextColor(15, 23, 42);
        doc.text(cleanText(title).toUpperCase(), margin + 4.5, y + 4.7);

        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(cleanText(subtitle), pageWidth - margin - 2.5, y + 4.7, {
            align: "right",
          });
        }
        y += 9.2;
      };

      const drawFormalInfoTable = (
        items: Array<{ label: string; value: string }>,
        cols = 2
      ) => {
        const colW = contentWidth / cols;

        for (let i = 0; i < items.length; i += cols) {
          const slice = items.slice(i, i + cols);
          const cells = slice.map((item) => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.3);
            const valLines = doc.splitTextToSize(
              cleanText(item.value),
              colW - 6
            ) as string[];
            return { ...item, valLines };
          });
          const maxLines = Math.max(...cells.map((c) => c.valLines.length), 1);
          const rowH = 6.2 + maxLines * 3.8;
          ensureSpace(rowH + 1);

          cells.forEach((cell, idx) => {
            const x = margin + idx * colW;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(226, 232, 240);
            doc.rect(x, y, colW, rowH, "FD");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.8);
            doc.setTextColor(100, 116, 139);
            doc.text(cleanText(cell.label).toUpperCase(), x + 2.8, y + 3.8);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.3);
            doc.setTextColor(15, 23, 42);
            doc.text(cell.valLines, x + 2.8, y + 7.7);
          });

          y += rowH;
        }
        y += 3.5;
      };

      const drawBulletBlock = (
        heading: string,
        rows: Array<{ primary: string; secondary?: string }>,
        emptyMsg: string
      ) => {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.4);
        doc.setTextColor(30, 41, 59);
        doc.text(cleanText(heading), margin, y);
        y += 4;

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
          doc.setFontSize(8.1);
          const pLines = doc.splitTextToSize(
            `- ${cleanText(row.primary)}`,
            contentWidth - 5
          ) as string[];
          const sLines = row.secondary
            ? (doc.splitTextToSize(
                `  ${cleanText(row.secondary)}`,
                contentWidth - 7
              ) as string[])
            : [];
          const needed = pLines.length * 3.7 + sLines.length * 3.3 + 1.5;
          ensureSpace(needed);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.1);
          doc.setTextColor(15, 23, 42);
          doc.text(pLines, margin + 1.5, y);
          y += pLines.length * 3.7;

          if (sLines.length) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(sLines, margin + 2.5, y);
            y += sLines.length * 3.3;
          }
          y += 1.2;
        }
        y += 2;
      };

      const drawCompetencyTable = (
        label: string,
        avg: number,
        items: EmployeeCardPdfData["softCompetencies"]
      ) => {
        ensureSpace(13);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.4);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `${cleanText(label)} (${items.length} kompetensi | Rata-rata: ${avg} / 5.0)`,
          margin,
          y
        );
        y += 3.8;

        if (!items.length) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("Belum ada data kompetensi dari SAP", margin + 2, y);
          y += 5.5;
          return;
        }

        ensureSpace(6.5);
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, y, contentWidth, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.4);
        doc.setTextColor(255, 255, 255);
        doc.text("NAMA KOMPETENSI", margin + 3, y + 4.1);
        doc.text("AKTUAL", margin + contentWidth - 42, y + 4.1);
        doc.text("IDEAL", margin + contentWidth - 18, y + 4.1);
        y += 6;

        items.forEach((item, idx) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.9);
          const nameLines = doc.splitTextToSize(
            cleanText(item.name),
            contentWidth - 52
          ) as string[];
          const rowH = Math.max(5.4, nameLines.length * 3.6 + 1.8);
          ensureSpace(rowH);

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, rowH, "F");
          } else {
            doc.setFillColor(255, 255, 255);
            doc.rect(margin, y, contentWidth, rowH, "F");
          }
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y, contentWidth, rowH, "D");

          doc.setTextColor(15, 23, 42);
          doc.text(nameLines, margin + 3, y + 3.8);
          doc.setFont("helvetica", "bold");
          doc.text(`Level ${item.profId}`, margin + contentWidth - 42, y + 3.8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          doc.text(
            item.idealLevel ? `Level ${item.idealLevel}` : "-",
            margin + contentWidth - 18,
            y + 3.8
          );
          y += rowH;
        });
        y += 4;
      };

      // ================= PAGE 1 FORMAL CORPORATE LETTERHEAD =================
      // Top thin green corporate bar
      doc.setFillColor(47, 143, 34);
      doc.rect(0, 0, pageWidth, 2.5, "F");

      // Logos Row (Top Left: Berau Coal | Top Right: Harmoni)
      const logoTopY = 7;
      if (berauLogo) {
        const berauH = 14;
        const berauW = berauH * berauLogo.aspect;
        doc.addImage(berauLogo.dataUrl, "PNG", margin, logoTopY, berauW, berauH);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("PT BERAU COAL", margin, logoTopY + 8);
      }

      if (harmoniLogo) {
        const harmoniH = 12.5;
        const harmoniW = harmoniH * harmoniLogo.aspect;
        doc.addImage(
          harmoniLogo.dataUrl,
          "PNG",
          pageWidth - margin - harmoniW,
          logoTopY + 0.8,
          harmoniW,
          harmoniH
        );
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(47, 143, 34);
        doc.text("HARMONI", pageWidth - margin, logoTopY + 8, { align: "right" });
      }

      // Centered Official Document Title
      const titleY = 27.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14.5);
      doc.setTextColor(15, 23, 42);
      doc.text("EMPLOYEE CARD", pageWidth / 2, titleY, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "HUMAN RESOURCES INFORMATION SYSTEM - PT BERAU COAL",
        pageWidth / 2,
        titleY + 4.3,
        { align: "center" }
      );

      // Dual Official Divider Lines
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.7);
      doc.line(margin, titleY + 7, pageWidth - margin, titleY + 7);
      doc.setDrawColor(47, 143, 34);
      doc.setLineWidth(0.35);
      doc.line(margin, titleY + 8.1, pageWidth - margin, titleY + 8.1);
      doc.setLineWidth(0.2);

      // Formal Identity Summary Box
      const generatedAt = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const idBoxY = titleY + 11.5;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, idBoxY, contentWidth, 18.5, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanText(data.name), margin + 4, idBoxY + 6.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `${cleanText(data.position)}  |  ${cleanText(data.department)}`,
        margin + 4,
        idBoxY + 11.8
      );

      doc.setFontSize(7.8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `NIK: ${cleanText(data.nik)}  |  Business Unit: ${cleanText(data.businessUnit)}`,
        margin + 4,
        idBoxY + 16
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(47, 143, 34);
      doc.text("DOKUMEN INTERNAL HR", pageWidth - margin - 4, idBoxY + 6, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${generatedAt}`, pageWidth - margin - 4, idBoxY + 10.8, {
        align: "right",
      });

      y = idBoxY + 23;

      // 1. Profil Karyawan
      drawSectionHeader("1. Profil Karyawan", "Data Master & Kontak");
      drawFormalInfoTable([
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
      drawSectionHeader("2. Capability & Talent Profile", "BigQuery - Data Terkini");
      drawFormalInfoTable([
        { label: "Current Role", value: data.currentRole },
        { label: "Talent Class", value: data.talentClass },
        { label: "Education", value: data.education },
        { label: "Fast Track", value: data.fastTrack },
      ]);
      drawFormalInfoTable(
        [{ label: "BU Visibility Scale", value: data.buVisibility }],
        1
      );

      // 3. Competency Scale
      drawSectionHeader("3. Competency Scale (SAP)", "Siklus 1-2 Tahun");
      drawCompetencyTable(
        "Soft Competencies Scale",
        data.softAverage,
        data.softCompetencies
      );
      drawCompetencyTable(
        "Technical Competency Scale",
        data.technicalAverage,
        data.technicalCompetencies
      );

      // 4. Career & Aspiration
      drawSectionHeader("4. Career History & Aspiration", "BigQuery / MyAgility");
      drawBulletBlock(
        "Career & Experience",
        data.careerHistory.map((c) => ({ primary: c.title, secondary: c.period })),
        "Belum tersedia dari SAP"
      );
      drawBulletBlock(
        "Career Aspiration (MyAgility - 3 Entri Terbaru)",
        data.aspirations.map((a) => ({ primary: a.content, secondary: a.dateStr })),
        "Belum tersedia dari SAP / MyAgility"
      );

      // 5. Project Assignment & Certification
      drawSectionHeader("5. Project Assignment & Certification", "3 Tahun Terakhir");
      drawFormalInfoTable([
        { label: "Project Contribution", value: data.projectContribution },
        { label: "Project Impact", value: data.projectImpact },
      ]);
      drawBulletBlock(
        "Project Involvement",
        data.projects.map((p) => ({ primary: p.title, secondary: p.date })),
        "Belum tersedia dari SAP"
      );
      drawBulletBlock(
        "Certification",
        data.certifications.map((c) => ({ primary: c.title, secondary: c.subtitle })),
        "Belum diisi"
      );

      // 6. Assessment & HSE-CT
      drawSectionHeader("6. Assessment & HSE-CT", "Assessment Center & Medical/HSE");
      drawFormalInfoTable([
        { label: "IQ Score", value: data.assessment.iq },
        { label: "IQ Category", value: data.assessment.iqCategory },
        { label: "DISC", value: data.assessment.disc },
        { label: "DISC Category", value: data.assessment.discCategory },
      ]);
      drawFormalInfoTable(
        [{ label: "Matchup Result", value: data.assessment.matchupResult }],
        1
      );
      drawFormalInfoTable(
        [
          { label: "MCU", value: data.hse.mcu },
          { label: "SID", value: data.hse.sid },
          { label: "SIMPER", value: data.hse.simper },
        ],
        3
      );
      drawFormalInfoTable(
        [{ label: "HSE CT Summary", value: data.hse.summary }],
        1
      );

      // 7. Performance Profile & 360 Review
      drawSectionHeader("7. Performance Profile & 360 Review", `Tahun ${data.currentYear}`);
      drawFormalInfoTable(
        [
          { label: "Performance 2025", value: data.performance.y2025 },
          { label: "Performance 2024", value: data.performance.y2024 },
          { label: "Performance 2023", value: data.performance.y2023 },
        ],
        3
      );
      drawFormalInfoTable(
        [
          { label: `Strength (${data.currentYear})`, value: data.strengthText },
          { label: `Weakness (${data.currentYear})`, value: data.weaknessText },
        ],
        2
      );
      drawFormalInfoTable(
        [
          {
            label: `Ringkasan Evaluasi 360 (${data.currentYear})`,
            value: data.summary360,
          },
        ],
        1
      );
      if (data.comments360.length) {
        drawBulletBlock(
          `Komentar 360 Terkurasi (${data.comments360.length})`,
          data.comments360.map((c) => ({ primary: c.text, secondary: c.date })),
          "Belum ada komentar"
        );
      }

      // 8. AI Insight & IDP (Optional)
      if (data.aiInsight) {
        drawSectionHeader("8. AI Insight & IDP 70-20-10", data.aiInsight.readinessLabel);
        drawFormalInfoTable(
          [{ label: "Executive Readiness Summary", value: data.aiInsight.summary }],
          1
        );
        drawBulletBlock(
          "Priority Skill Gaps",
          data.aiInsight.prioritySkillGaps.map((g) => ({
            primary: `${g.skillName}${g.gap !== undefined ? ` (Gap ${g.gap})` : ""}`,
            secondary: g.evidenceSummary,
          })),
          "Belum ada catatan skill gap"
        );
        drawBulletBlock(
          "70% On-The-Job Action",
          data.aiInsight.idpSeventy.map((item) => ({ primary: item })),
          "Belum ada aksi 70%"
        );
        drawBulletBlock(
          "20% Coaching & Mentoring",
          data.aiInsight.idpTwenty.map((item) => ({ primary: item })),
          "Belum ada aksi 20%"
        );
        drawBulletBlock(
          "10% Structured Learning",
          data.aiInsight.idpTen.map((item) => ({ primary: item })),
          "Belum ada aksi 10%"
        );
      }

      // Add formal running header (page 2+) and footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        if (i > 1) {
          doc.setFillColor(47, 143, 34);
          doc.rect(0, 0, pageWidth, 1.5, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(
            `EMPLOYEE CARD - ${cleanText(data.name)} (NIK: ${cleanText(data.nik)})`,
            margin,
            9.5
          );
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text("PT BERAU COAL | HARMONI", pageWidth - margin, 9.5, {
            align: "right",
          });
          doc.setDrawColor(203, 213, 225);
          doc.line(margin, 11.5, pageWidth - margin, 11.5);
        }

        doc.setDrawColor(203, 213, 225);
        doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Employee Card - ${cleanText(data.name)} | PT Berau Coal - Harmoni HR Monitoring`,
          margin,
          pageHeight - 6.5
        );
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth - margin,
          pageHeight - 6.5,
          { align: "right" }
        );
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
