import { prisma } from "@/lib/prisma";

export type TalentTrack = {
  workLocation?: string;
  jobLevel?: string;
  performance?: number[];
  potential?: number;
  readiness?: number;
  technical?: string[];
  behavioral?: string[];
  certifications?: string[];
  projects?: string[];
  careerHistory?: string[];
  aspiration?: string;
  hse?: { mcu?: string; simper?: string; incidentFreeMonths?: number };
  assessment?: { iq?: number; eq?: number; leadership?: number };
};

export type TalentDevelopmentCandidate = {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  nik: string | null;
  department: string | null;
  currentPosition: string | null;
  supervisorName: string | null;
  joinDate: Date;
  yearsOfService: number;
  track: TalentTrack;
  dataSignals: number;
};

export type RankedTalentCandidate = TalentDevelopmentCandidate & {
  matchScore: number;
  dataConfidence: number;
  roleRelevance: number;
  performanceScore: number;
  experienceScore: number;
  readiness: string;
  strengths: string[];
  gaps: string[];
  developmentFocus: string[];
};

export async function listTalentDevelopmentCandidates(): Promise<TalentDevelopmentCandidate[]> {
  const profiles = await prisma.profile.findMany({
    where: { workforceStage: "EMPLOYEE" },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return profiles.map((profile) => {
    const track = asTalentTrack(profile.talentData);
    const joinDate = profile.joinDate ?? profile.createdAt;
    const yearsOfService = joinDate
      ? Math.max(0, (Date.now() - joinDate.getTime()) / 31_557_600_000)
      : 0;
    return {
      id: profile.id,
      name: profile.user.name,
      email: profile.user.email,
      photoUrl: profile.photoUrl,
      nik: profile.nik,
      department: profile.department,
      currentPosition: profile.position,
      supervisorName: profile.supervisorName,
      joinDate,
      yearsOfService: Number(yearsOfService.toFixed(1)),
      track,
      dataSignals: countSignals(track),
    };
  });
}

export function rankTalentCandidates(
  candidates: TalentDevelopmentCandidate[],
  targetPosition: string
): RankedTalentCandidate[] {
  const target = tokenize(targetPosition);
  return candidates.map((candidate) => {
    const track = candidate.track;
    const roleCorpus = [candidate.currentPosition, candidate.department, track.aspiration, ...(track.technical ?? []), ...(track.projects ?? [])].join(" ");
    const corpus = tokenize(roleCorpus);
    const exactMatches = target.filter((word) => corpus.includes(word)).length;
    const aspirationBoost = tokenize(track.aspiration ?? "").some((word) => target.includes(word)) ? 18 : 0;
    const leadershipBoost = /manager|superintendent|supervisor|lead|head/i.test(targetPosition)
      ? Math.max(0, ((track.assessment?.leadership ?? 60) - 60) * 0.45)
      : 0;
    const roleRelevance = clamp(Math.round((target.length ? exactMatches / target.length : 0) * 72 + aspirationBoost + leadershipBoost));
    const performanceScore = average(track.performance ?? []) ?? 60;
    const experienceScore = clamp(Math.round(candidate.yearsOfService * 8));
    const potential = track.potential ?? 60;
    const readinessSignal = track.readiness ?? 60;
    const technicalBreadth = clamp((track.technical?.length ?? 0) * 16);
    const matchScore = Math.round(
      roleRelevance * 0.28 + technicalBreadth * 0.18 + performanceScore * 0.18
      + potential * 0.14 + readinessSignal * 0.14 + experienceScore * 0.08
    );
    const dataConfidence = clamp(Math.round((candidate.dataSignals / 10) * 100));
    const readiness = matchScore >= 80 ? "Ready now" : matchScore >= 65 ? "Ready with development" : "Long-term pipeline";
    const strengths = [
      performanceScore >= 88 ? `Performance 3 tahun konsisten (${performanceScore})` : null,
      potential >= 88 ? `Potential tinggi (${potential})` : null,
      roleRelevance >= 70 ? "Track record relevan dengan posisi tujuan" : null,
      (track.assessment?.leadership ?? 0) >= 87 ? "Leadership assessment kuat" : null,
      (track.certifications?.length ?? 0) >= 2 ? `${track.certifications!.length} sertifikasi relevan` : null,
    ].filter((item): item is string => Boolean(item)).slice(0, 3);
    const gaps = [
      roleRelevance < 70 ? `Exposure langsung ke role ${targetPosition}` : null,
      readinessSignal < 82 ? "Readiness perlu divalidasi melalui panel" : null,
      (track.assessment?.leadership ?? 0) < 84 && /manager|superintendent|supervisor|lead|head/i.test(targetPosition) ? "Leadership scope" : null,
      experienceScore < 70 ? "Pengalaman pada scope yang lebih besar" : null,
    ].filter((item): item is string => Boolean(item)).slice(0, 3);
    const developmentFocus = [
      gaps[0] ?? `Stretch assignment untuk ${targetPosition}`,
      "Mentoring oleh incumbent atau atasan posisi tujuan",
      "Business impact project dengan outcome terukur",
    ];
    return { ...candidate, matchScore, dataConfidence, roleRelevance, performanceScore, experienceScore, readiness, strengths, gaps, developmentFocus };
  }).sort((a, b) => b.matchScore - a.matchScore || b.dataConfidence - a.dataConfidence);
}

function asTalentTrack(value: unknown): TalentTrack {
  return value && typeof value === "object" && !Array.isArray(value) ? value as TalentTrack : {};
}

function countSignals(track: TalentTrack) {
  return [track.jobLevel, track.performance?.length, track.potential, track.readiness, track.technical?.length,
    track.behavioral?.length, track.certifications?.length, track.projects?.length, track.careerHistory?.length,
    track.assessment?.leadership].filter(Boolean).length;
}

function tokenize(value: string) {
  return Array.from(new Set(value.toLocaleLowerCase("id-ID").split(/[^a-z0-9]+/).filter((word) => word.length > 2)));
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
