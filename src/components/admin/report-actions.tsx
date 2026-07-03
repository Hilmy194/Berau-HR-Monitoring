"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ReportRow {
  name: string;
  position: string;
  department: string;
  joinDate: string;
  taskProgress: string;
  score: string;
  coachingCount: number;
  status: string;
}

interface ReportActionsProps {
  generatedAt: string;
  metrics: Array<{ label: string; value: number }>;
  statusDistribution: Array<{ name: string; value: number; fill: string }>;
  monthlyTrend: Array<{ month: string; count: number }>;
  rows: ReportRow[];
}

export function ReportActions({
  generatedAt,
  metrics,
  statusDistribution,
  monthlyTrend,
  rows,
}: ReportActionsProps) {
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;

      doc.setFillColor(26, 78, 43);
      doc.rect(0, 0, pageWidth, 27, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("HR Digital - Probation Report", margin, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Generated ${generatedAt}`, margin, 19);

      const cardGap = 4;
      const cardWidth = (pageWidth - margin * 2 - cardGap * (metrics.length - 1)) / metrics.length;
      metrics.forEach((metric, index) => {
        const x = margin + index * (cardWidth + cardGap);
        doc.setFillColor(245, 248, 246);
        doc.roundedRect(x, 34, cardWidth, 22, 2, 2, "F");
        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(String(metric.value), x + 5, 44);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(metric.label, x + 5, 51);
      });

      const statusCanvas = createStatusChart(statusDistribution);
      const trendCanvas = createTrendChart(monthlyTrend);
      doc.addImage(statusCanvas.toDataURL("image/png"), "PNG", margin, 63, 128, 64);
      doc.addImage(trendCanvas.toDataURL("image/png"), "PNG", 157, 63, 128, 64);

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Employee Detail", margin, 137);
      drawTable(doc, rows, 143, margin, pageWidth, pageHeight);

      const datePart = new Date().toISOString().slice(0, 10);
      doc.save(`probation-report-${datePart}.pdf`);
      toast.success("PDF report berhasil diunduh");
    } catch (error) {
      console.error("[REPORT_EXPORT_ERROR]", error);
      toast.error("Gagal membuat PDF report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={exportPdf} disabled={exporting}>
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {exporting ? "Generating PDF..." : "Export PDF"}
    </Button>
  );
}

function createStatusChart(data: ReportActionsProps["statusDistribution"]) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 450;
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111827";
  context.font = "bold 28px Arial";
  context.fillText("Probation Status Distribution", 30, 45);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let angle = -Math.PI / 2;
  data.forEach((item) => {
    const slice = total > 0 ? (item.value / total) * Math.PI * 2 : 0;
    context.beginPath();
    context.strokeStyle = item.fill;
    context.lineWidth = 54;
    context.arc(220, 245, 112, angle, angle + slice);
    context.stroke();
    angle += slice;
  });
  context.fillStyle = "#111827";
  context.font = "bold 38px Arial";
  context.textAlign = "center";
  context.fillText(String(total), 220, 242);
  context.font = "20px Arial";
  context.fillStyle = "#64748b";
  context.fillText("Employees", 220, 272);
  context.textAlign = "left";

  data.forEach((item, index) => {
    const y = 125 + index * 64;
    context.fillStyle = item.fill;
    context.fillRect(440, y, 24, 24);
    context.fillStyle = "#111827";
    context.font = "22px Arial";
    context.fillText(item.name, 480, y + 20);
    context.font = "bold 22px Arial";
    context.fillText(String(item.value), 700, y + 20);
  });
  return canvas;
}

function createTrendChart(data: ReportActionsProps["monthlyTrend"]) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 450;
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111827";
  context.font = "bold 28px Arial";
  context.fillText("Monthly New Hire Trend", 30, 45);

  const chartLeft = 60;
  const chartBottom = 375;
  const chartHeight = 260;
  const max = Math.max(1, ...data.map((item) => item.count));
  const barSpace = (canvas.width - 100) / Math.max(data.length, 1);
  const barWidth = Math.min(75, barSpace * 0.58);

  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(chartLeft, chartBottom);
  context.lineTo(canvas.width - 30, chartBottom);
  context.stroke();

  data.forEach((item, index) => {
    const height = (item.count / max) * chartHeight;
    const x = chartLeft + index * barSpace + (barSpace - barWidth) / 2;
    const y = chartBottom - height;
    context.fillStyle = "#3b82f6";
    context.fillRect(x, y, barWidth, height);
    context.textAlign = "center";
    context.fillStyle = "#111827";
    context.font = "bold 19px Arial";
    context.fillText(String(item.count), x + barWidth / 2, y - 10);
    context.fillStyle = "#64748b";
    context.font = "18px Arial";
    context.fillText(item.month, x + barWidth / 2, chartBottom + 30);
  });
  context.textAlign = "left";
  return canvas;
}

function drawTable(
  doc: import("jspdf").jsPDF,
  rows: ReportRow[],
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
) {
  const headers = ["Employee", "Department", "Join Date", "Tasks", "Score", "Coaching", "Status"];
  const widths = [56, 42, 31, 34, 22, 25, 31];
  const rowHeight = 9;
  let y = startY;

  const drawHeader = () => {
    doc.setFillColor(230, 238, 232);
    doc.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    let x = margin + 2;
    headers.forEach((header, index) => {
      doc.text(header, x, y + 5.8);
      x += widths[index];
    });
    y += rowHeight;
  };

  drawHeader();
  if (rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.text("No report data available.", margin + 2, y + 6);
    return;
  }

  rows.forEach((row, index) => {
    if (y + rowHeight > pageHeight - 12) {
      doc.addPage("a4", "landscape");
      y = 14;
      drawHeader();
    }
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");
    }
    const values = [
      `${row.name} - ${row.position}`,
      row.department,
      row.joinDate,
      row.taskProgress,
      row.score,
      String(row.coachingCount),
      row.status,
    ];
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    let x = margin + 2;
    values.forEach((value, valueIndex) => {
      const clipped = value.length > 34 ? `${value.slice(0, 31)}...` : value;
      doc.text(clipped, x, y + 5.8);
      x += widths[valueIndex];
    });
    y += rowHeight;
  });
}
