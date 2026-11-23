import { UsersRound, Trophy, ShieldCheck, Compass } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import {
  getSuccessionPipeline,
  getSuccessionSummary,
  listAllSuccessorsDirectory,
} from "@/lib/services/succession.service";
import { SuccessionDirectory } from "@/components/talent/succession-directory";

export const metadata = {
  title: "Succession Planning - Harmoni",
  description: "Peta suksesi posisi kunci, daftar nominasi calon suksesor, dan pemetaan kesiapan kepemimpinan.",
};

export default async function SuccessionPlanningPage() {
  await requireAuth();

  const targets = getSuccessionPipeline();
  const summary = getSuccessionSummary();
  const successors = listAllSuccessorsDirectory();

  return (
    <div className="space-y-6 pb-10">
      <ModuleHero
        eyebrow="Talent Management"
        title="Succession Planning"
        description="Pemetaan nominasi suksesor untuk posisi kepemimpinan kunci, evaluasi kesiapan kandidat (Ready Now / Ready Later), serta penelusuran jalur suksesi per karyawan."
        icon={Trophy}
      />

      <SuccessionDirectory
        targets={targets}
        summary={summary}
        successors={successors}
      />
    </div>
  );
}
