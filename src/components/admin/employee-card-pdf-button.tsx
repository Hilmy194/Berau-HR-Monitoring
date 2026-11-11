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
    const aspect = await Promise.all([
      new Promise<number>((resolve) => {
        const img = new Image();
        img.onload = () =>
          resolve(
            img.naturalWidth && img.naturalHeight
              ? img.naturalWidth / img.naturalHeight
              : 1
          );
        img.onerror = () => resolve(1);
        img.src = dataUrl;
      }),
    ]).then(([a]) => a);
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
      const pageTopY = 19;
      const bottomLimit = pageHeight - 17;

      let y = pageTopY;

      const sanitizeChars = (raw: string) =>
        raw
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2013\u2014]/g, "-")
          .replace(/\u2022/g, "-")
          .replace(/\u00B0/g, " deg")
          .replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, " ");

      const cleanSingleLine = (val?: string | number | null, fallback = "-") => {
        const s = sanitizeChars(String(val ?? ""))
          .replace(/\s+/g, " ")
          .trim();
        return s || fallback;
      };

      const cleanMultiline = (val?: string | number | null, fallback = "-") => {
        const normalized = sanitizeChars(String(val ?? ""))
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .split("\n")
          .map((line) => line.replace(/[ \t]+/g, " ").trim())
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        return normalized || fallback;
      };

      const splitParagraphsToLines = (
        text: string,
        maxWidth: number,
        preserveNewlines = true
      ): string[] => {
        if (!preserveNewlines) {
          return doc.splitTextToSize(cleanSingleLine(text), maxWidth) as string[];
        }
        const paragraphs = cleanMultiline(text).split("\n");
        const result: string[] = [];
        paragraphs.forEach((para, idx) => {
          if (!para) {
            if (idx > 0 && idx < paragraphs.length - 1) result.push("");
            return;
          }
          const wrapped = doc.splitTextToSize(para, maxWidth) as string[];
          result.push(...wrapped);
        });
        return result.length ? result : ["-"];
      };

      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight > bottomLimit) {
          doc.addPage();
          y = pageTopY;
        }
      };

      const drawSectionHeader = (title: string, subtitle?: string) => {
        if (y > pageTopY + 2) y += 2.5;
        ensureSpace(26);

        const boxH = 8;
        doc.setFillColor(244, 247, 250);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, boxH, "FD");
        doc.setFillColor(47, 143, 34);
        doc.rect(margin, y, 2.5, boxH, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(cleanSingleLine(title).toUpperCase(), margin + 5, y + 5.4);

        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(cleanSingleLine(subtitle), pageWidth - margin - 3, y + 5.3, {
            align: "right",
          });
        }
        y += boxH + 5;
      };

      const drawFormalInfoTable = (
        items: Array<{ label: string; value: string; multiline?: boolean }>,
        cols = 2
      ) => {
        const colW = contentWidth / cols;
        const lineH = 4.2;

        for (let i = 0; i < items.length; i += cols) {
          const slice = items.slice(i, i + cols);
          const cells = slice.map((item) => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.4);
            const valLines = splitParagraphsToLines(
              item.value,
              colW - 6.5,
              Boolean(item.multiline)
            );
            return { ...item, valLines };
          });
          const maxLines = Math.max(...cells.map((c) => c.valLines.length), 1);
          const rowH = Math.max(12.5, 8.8 + maxLines * lineH + 1.5);
          ensureSpace(rowH + 1);

          cells.forEach((cell, idx) => {
            const x = margin + idx * colW;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(226, 232, 240);
            doc.rect(x, y, colW, rowH, "FD");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.9);
            doc.setTextColor(100, 116, 139);
            doc.text(cleanSingleLine(cell.label).toUpperCase(), x + 3, y + 4.3);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.4);
            doc.setTextColor(15, 23, 42);
            doc.text(cell.valLines, x + 3, y + 8.6, { lineHeightFactor: 1.25 });
          });

          y += rowH;
        }
        y += 4;
      };

      const drawBulletBlock = (
        heading: string,
        rows: Array<{ primary: string; secondary?: string }>,
        emptyMsg: string
      ) => {
        ensureSpace(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(cleanSingleLine(heading), margin, y);
        y += 5;

        if (!rows.length) {
          ensureSpace(7);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(cleanSingleLine(emptyMsg), margin + 2.5, y);
          y += 6;
          return;
        }

        const primaryLineH = 4.1;
        const secondaryLineH = 3.7;

        for (const row of rows) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.2);
          const pLines = splitParagraphsToLines(`- ${row.primary}`, contentWidth - 6, true);
          const sLines = row.secondary
            ? splitParagraphsToLines(row.secondary, contentWidth - 10, true)
            : [];
          const needed =
            pLines.length * primaryLineH +
            (sLines.length ? sLines.length * secondaryLineH + 0.8 : 0) +
            2.5;
          ensureSpace(needed);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.2);
          doc.setTextColor(15, 23, 42);
          doc.text(pLines, margin + 2, y, { lineHeightFactor: 1.22 });
          y += pLines.length * primaryLineH;

          if (sLines.length) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.7);
            doc.setTextColor(100, 116, 139);
            doc.text(sLines, margin + 5, y + 0.4, { lineHeightFactor: 1.2 });
            y += sLines.length * secondaryLineH + 0.8;
          }
          y += 2;
        }
        y += 2.5;
      };

      const drawCompetencyTable = (
        label: string,
        avg: number,
        items: EmployeeCardPdfData["softCompetencies"]
      ) => {
        ensureSpace(18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `${cleanSingleLine(label)} (${items.length} kompetensi | Rata-rata: ${avg} / 5.0)`,
          margin,
          y
        );
        y += 5;

        if (!items.length) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("Belum ada data kompetensi dari SAP", margin + 2.5, y);
          y += 6.5;
          return;
        }

        ensureSpace(8);
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, y, contentWidth, 6.8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("NAMA KOMPETENSI", margin + 3, y + 4.6);
        doc.text("AKTUAL", margin + contentWidth - 42, y + 4.6);
        doc.text("IDEAL", margin + contentWidth - 18, y + 4.6);
        y += 6.8;

        items.forEach((item, idx) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const nameLines = doc.splitTextToSize(
            cleanSingleLine(item.name),
            contentWidth - 52
          ) as string[];
          const rowH = Math.max(6.8, nameLines.length * 4 + 2.6);
          ensureSpace(rowH);

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y, contentWidth, rowH, "FD");

          doc.setTextColor(15, 23, 42);
          doc.text(nameLines, margin + 3, y + 4.5, { lineHeightFactor: 1.2 });
          doc.setFont("helvetica", "bold");
          doc.text(`Level ${item.profId}`, margin + contentWidth - 42, y + 4.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          doc.text(
            item.idealLevel ? `Level ${item.idealLevel}` : "-",
            margin + contentWidth - 18,
            y + 4.5
          );
          y += rowH;
        });
        y += 5;
      };

      // ================= PAGE 1 FORMAL CORPORATE LETTERHEAD =================
      doc.setFillColor(47, 143, 34);
      doc.rect(0, 0, pageWidth, 2.8, "F");

      const logoTopY = 7;
      if (berauLogo) {
        const berauH = 14.5;
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
          logoTopY + 1,
          harmoniW,
          harmoniH
        );
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(47, 143, 34);
        doc.text("HARMONI", pageWidth - margin, logoTopY + 8, { align: "right" });
      }

      const titleY = 28.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("EMPLOYEE CARD", pageWidth / 2, titleY, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "HUMAN RESOURCES INFORMATION SYSTEM - PT BERAU COAL",
        pageWidth / 2,
        titleY + 4.6,
        { align: "center" }
      );

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.75);
      doc.line(margin, titleY + 7.5, pageWidth - margin, titleY + 7.5);
      doc.setDrawColor(47, 143, 34);
      doc.setLineWidth(0.35);
      doc.line(margin, titleY + 8.7, pageWidth - margin, titleY + 8.7);
      doc.setLineWidth(0.2);

      // Formal Identity Summary Card
      const generatedAt = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const idBoxY = titleY + 12.5;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, idBoxY, contentWidth, 21, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanSingleLine(data.name), margin + 4.5, idBoxY + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.6);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `${cleanSingleLine(data.position)}  |  ${cleanSingleLine(data.department)}`,
        margin + 4.5,
        idBoxY + 12.5
      );

      doc.setFontSize(7.9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `NIK: ${cleanSingleLine(data.nik)}  |  Business Unit: ${cleanSingleLine(data.businessUnit)}`,
        margin + 4.5,
        idBoxY + 17.3
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(47, 143, 34);
      doc.text("DOKUMEN INTERNAL HR", pageWidth - margin - 4.5, idBoxY + 6.8, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${generatedAt}`, pageWidth - margin - 4.5, idBoxY + 12, {
        align: "right",
      });

      y = idBoxY + 26;

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
        [{ label: "BU Visibility Scale", value: data.buVisibility, multiline: true }],
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
        { label: "Project Contribution", value: data.projectContribution, multiline: true },
        { label: "Project Impact", value: data.projectImpact, multiline: true },
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
        [{ label: "HSE CT Summary", value: data.hse.summary, multiline: true }],
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
          {
            label: `Strength (${data.currentYear})`,
            value: data.strengthText,
            multiline: true,
          },
          {
            label: `Weakness (${data.currentYear})`,
            value: data.weaknessText,
            multiline: true,
          },
        ],
        1
      );
      drawFormalInfoTable(
        [
          {
            label: `Ringkasan Evaluasi 360 (${data.currentYear})`,
            value: data.summary360,
            multiline: true,
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
          [
            {
              label: "Executive Readiness Summary",
              value: data.aiInsight.summary,
              multiline: true,
            },
          ],
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

      // Running header (page 2+) and footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        if (i > 1) {
          doc.setFillColor(47, 143, 34);
          doc.rect(0, 0, pageWidth, 1.8, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(
            `EMPLOYEE CARD - ${cleanSingleLine(data.name)} (NIK: ${cleanSingleLine(data.nik)})`,
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
          doc.line(margin, 12, pageWidth - margin, 12);
        }

        doc.setDrawColor(203, 213, 225);
        doc.line(margin, pageHeight - 11.5, pageWidth - margin, pageHeight - 11.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Employee Card - ${cleanSingleLine(data.name)} | PT Berau Coal - Harmoni HR Monitoring`,
          margin,
          pageHeight - 6.8
        );
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth - margin,
          pageHeight - 6.8,
          { align: "right" }
        );
      }

      const safeFileName = cleanSingleLine(data.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const safeNik = cleanSingleLine(data.nik).replace(/[^a-zA-Z0-9_-]/g, "");
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
