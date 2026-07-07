import { NextResponse } from "next/server";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertAdmin } from "@/lib/api-guard";
import { listTalentDevelopmentCandidates, rankTalentCandidates } from "@/lib/services/talent-development.service";

const requestSchema = z.object({ targetPosition: z.string().trim().min(3).max(120) });

export async function POST(request: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Jabatan tujuan tidak valid." }, { status: 400 });

  const ranked = rankTalentCandidates(await listTalentDevelopmentCandidates(), parsed.data.targetPosition).slice(0, 6);
  const apiKey = await resolveOpenAiApiKey();
  if (!apiKey) {
    return NextResponse.json({
      mode: "DETERMINISTIC",
      message: "OPENAI_API_KEY belum dikonfigurasi. Shortlist tetap dihitung oleh scoring engine.",
      shortlist: ranked,
    });
  }

  const evidence = ranked.map(({ id, name, department, currentPosition, yearsOfService, track, matchScore, dataConfidence }) => ({
    id, name, department, currentPosition, yearsOfService, matchScore, dataConfidence,
    performance: track.performance, potential: track.potential, readiness: track.readiness,
    technical: track.technical, behavioral: track.behavioral, certifications: track.certifications,
    projects: track.projects, careerHistory: track.careerHistory, aspiration: track.aspiration,
    assessment: track.assessment,
  }));

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_TALENT_MODEL || "gpt-5.4-mini",
        instructions: [
          "Anda adalah copilot Talent Management untuk perusahaan pertambangan Indonesia.",
          "Analisis hanya evidence yang diberikan. Jangan gunakan gender, umur, agama, atau atribut terlindungi.",
          "Jangan mengarang fakta. Ranking awal adalah decision-support, bukan keputusan promosi.",
          "Pilih maksimal 5 kandidat dan jelaskan dalam Bahasa Indonesia.",
          "Untuk setiap skill gap, bandingkan bukti level saat ini dengan kebutuhan posisi target. Jika requirement posisi belum eksplisit, nyatakan bahwa target merupakan inferensi role, bukan fakta HR.",
          "Susun IDP yang menutup skill gap dengan pola 70-20-10: pengalaman kerja, coaching/mentoring, dan pembelajaran formal. Setiap aktivitas wajib punya owner, periode, dan ukuran keberhasilan.",
        ].join(" "),
        input: JSON.stringify({ targetPosition: parsed.data.targetPosition, candidates: evidence }),
        text: {
          format: {
            type: "json_schema",
            name: "talent_match_result",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                candidates: {
                  type: "array", maxItems: 5,
                  items: {
                    type: "object", additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      rationale: { type: "string" },
                      strengths: { type: "array", items: { type: "string" }, maxItems: 3 },
                      skillGaps: {
                        type: "array", minItems: 1, maxItems: 5,
                        items: {
                          type: "object", additionalProperties: false,
                          properties: {
                            skill: { type: "string" },
                            currentLevel: { type: "string" },
                            targetLevel: { type: "string" },
                            gap: { type: "string" },
                            evidence: { type: "string" },
                            priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                          },
                          required: ["skill", "currentLevel", "targetLevel", "gap", "evidence", "priority"],
                        },
                      },
                      idpActivities: {
                        type: "array", minItems: 3, maxItems: 6,
                        items: {
                          type: "object", additionalProperties: false,
                          properties: {
                            category: { type: "string", enum: ["70_EXPERIENCE", "20_SOCIAL", "10_FORMAL"] },
                            title: { type: "string" },
                            action: { type: "string" },
                            closesSkillGap: { type: "string" },
                            owner: { type: "string" },
                            period: { type: "string" },
                            successMetric: { type: "string" },
                          },
                          required: ["category", "title", "action", "closesSkillGap", "owner", "period", "successMetric"],
                        },
                      },
                    },
                    required: ["id", "rationale", "strengths", "skillGaps", "idpActivities"],
                  },
                },
              },
              required: ["summary", "candidates"],
            },
          },
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
    const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const outputText = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("OpenAI API tidak mengembalikan output terstruktur.");
    const ai = JSON.parse(outputText) as { summary: string; candidates: Array<{ id: string; rationale: string; strengths: string[]; skillGaps: Array<{ skill:string; currentLevel:string; targetLevel:string; gap:string; evidence:string; priority:"HIGH"|"MEDIUM"|"LOW" }>; idpActivities: Array<{ category:"70_EXPERIENCE"|"20_SOCIAL"|"10_FORMAL"; title:string; action:string; closesSkillGap:string; owner:string; period:string; successMetric:string }> }> };
    const allowedIds = new Set(ranked.map((item) => item.id));
    ai.candidates = ai.candidates.filter((item) => allowedIds.has(item.id));
    return NextResponse.json({ mode: "AI", model: process.env.OPENAI_TALENT_MODEL || "gpt-5.4-mini", ...ai });
  } catch (error) {
    console.error("[TALENT_AI_MATCH]", error);
    return NextResponse.json({ mode: "DETERMINISTIC", message: "AI sedang tidak tersedia; shortlist scoring tetap dapat digunakan.", shortlist: ranked });
  }
}

/**
 * Environment variables remain the production source of truth. The ignored
 * requirements file is supported only so this local prototype can be tested
 * without copying or exposing the key in client code.
 */
async function resolveOpenAiApiKey() {
  if (process.env.OPENAI_API_KEY?.trim()) return process.env.OPENAI_API_KEY.trim();

  try {
    const content = await readFile(path.join(process.cwd(), "requirements", "openAI-API.txt"), "utf8");
    const match = content.match(/sk-[A-Za-z0-9_-]+/);
    return match?.[0] ?? null;
  } catch {
    return null;
  }
}
