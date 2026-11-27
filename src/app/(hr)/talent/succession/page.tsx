import { UsersRound, Trophy, ShieldCheck, Compass } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import {
  getSuccessionPipelineFromDb,
  getSuccessionSummary,
  listAllSuccessorsDirectory,
  listSuccessionHistory,
} from "@/lib/services/succession.service";
import { SuccessionDirectory } from "@/components/talent/succession-directory";
import { listEmployeeMaster } from "@/lib/services/hr-modules.service";

export const metadata = {
  title: "Succession Planning - Harmoni",
  description: "Peta suksesi posisi kunci, daftar nominasi calon suksesor, dan pemetaan kesiapan kepemimpinan.",
};

export default async function SuccessionPlanningPage() {
  await requireAuth();

  const [targets, allEmployees] = await Promise.all([
    getSuccessionPipelineFromDb(),
    listEmployeeMaster(),
  ]);
  const summary = getSuccessionSummary(targets);
  const successors = listAllSuccessorsDirectory(targets);
  const history = await listSuccessionHistory();

  // Seluruh karyawan aktif dari database
  const availableEmployees = allEmployees.map((e) => ({
    name: e.name,
    nik: e.employeeId,
    currentPosition: e.currentPosition,
    golongan: e.currentLevel,
    department: e.department,
    division: e.division,
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Filter khusus karyawan level Manager ke atas untuk pilihan incumbent posisi kunci
  const managerEmployees = allEmployees
    .filter((e) => {
      const pos = (e.currentPosition || "").toLowerCase();
      const lvl = (e.currentLevel || "").toUpperCase();
      return (
        pos.includes("manager") ||
        pos.includes("gm") ||
        pos.includes("general manager") ||
        pos.includes("director") ||
        pos.includes("head") ||
        pos.includes("superintendent") ||
        pos.includes("chief") ||
        pos.includes("vp") ||
        ["5B", "5C", "5D", "6", "6A", "6B", "6C", "6D", "7", "7A", "8", "9", "10", "11", "12", "13"].includes(lvl)
      );
    })
    .map((e) => ({
      name: e.name,
      nik: e.employeeId,
      currentPosition: e.currentPosition,
      golongan: e.currentLevel,
      department: e.department,
      division: e.division,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Metadata dropdown dari database
  const distinctDivisions = Array.from(
    new Set(allEmployees.map((e) => e.division).filter(Boolean))
  ).sort() as string[];

  const distinctPositions = Array.from(
    new Set(allEmployees.map((e) => e.currentPosition).filter(Boolean))
  ).sort() as string[];

  const distinctGolongans = Array.from(
    new Set(allEmployees.map((e) => e.currentLevel).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="space-y-6 pb-10">
      <ModuleHero
        eyebrow="Talent Management"
        title="Succession Planning"
        description="Pemetaan nominasi suksesor untuk posisi kepemimpinan kunci, evaluasi kesiapan kandidat (Ready Now / Ready Later), serta penelusuran jalur suksesi dan riwayat pergerakan karier per karyawan."
        icon={Trophy}
      />

      <SuccessionDirectory
        targets={targets}
        summary={summary}
        successors={successors}
        history={history}
        availableEmployees={availableEmployees}
        managerEmployees={managerEmployees}
        divisions={distinctDivisions}
        positions={distinctPositions}
        golongans={distinctGolongans}
      />
    </div>
  );
}
