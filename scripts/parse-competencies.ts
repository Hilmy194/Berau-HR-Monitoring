import fs from "fs";
import path from "path";

const MD_PATH = "C:/Users/Ibnu Zaky F/.gemini/antigravity/brain/69fc9860-22cc-47a5-869b-b93730f186ba/.user_uploaded/media_1793681395966_42e745f9.md";
const OUTPUT_JSON_PATH = path.join(__dirname, "../src/lib/data/manual-competencies.json");

export type CompetencyItem = {
  groupId: string;
  groupName: string;
  qualId: string;
  name: string;
  profId: number;
  profDesc: string;
  startDate: string;
  endDate: string;
};

export type EmployeeCompetencyMap = Record<
  string,
  {
    name: string;
    soft: CompetencyItem[];
    technical: CompetencyItem[];
  }
>;

export function parseCompetencyMarkdown(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const groups: Record<string, string> = {};
  const proficiencies: Record<string, string> = {
    "0": "Without Rating",
    "1": "Knowledge (Pengetahuan)",
    "2": "Elementary (Aplikasi)",
    "3": "Advance (Peningkatan)",
    "4": "Mastery (Strategi)",
    "5": "Expertise (Inovasi)",
  };

  const employees: EmployeeCompetencyMap = {};
  let currentNik: string | null = null;
  let currentName: string = "";
  let section: "groups" | "prof" | "employees" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("## Referensi: Qualification Group")) {
      section = "groups";
      continue;
    }
    if (line.startsWith("## Referensi: Proficiency")) {
      section = "prof";
      continue;
    }
    if (line.startsWith("## Data per Karyawan")) {
      section = "employees";
      continue;
    }

    if (section === "groups") {
      if (line.startsWith("|") && !line.includes("Group ID") && !line.includes("---")) {
        const parts = line.split("|").map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          groups[parts[0]] = parts[1];
        }
      }
    } else if (section === "prof") {
      if (line.startsWith("|") && !line.includes("Proficiency ID") && !line.includes("---")) {
        const parts = line.split("|").map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          proficiencies[parts[0]] = parts[1];
        }
      }
    } else if (section === "employees") {
      if (line.startsWith("### ")) {
        const match = line.match(/^###\s+(\S+)\s+-\s+(.+)$/);
        if (match) {
          currentNik = match[1].trim();
          currentName = match[2].trim();
          employees[currentNik] = {
            name: currentName,
            soft: [],
            technical: []
          };
        }
      } else if (currentNik && line.startsWith("|") && !line.includes("Group ID") && !line.includes("---")) {
        const parts = line.split("|").map(s => s.trim()).filter(Boolean);
        if (parts.length >= 6) {
          const [groupId, qualId, qualDesc, profIdStr, start, end] = parts;
          const profId = parseInt(profIdStr, 10);
          const profDesc = proficiencies[profIdStr] || `Level ${profId}`;
          const item: CompetencyItem = {
            groupId,
            groupName: groups[groupId] || (groupId === "96801028" ? "Soft Competency" : "Technical Competency"),
            qualId,
            name: qualDesc,
            profId: Number.isNaN(profId) ? 0 : profId,
            profDesc,
            startDate: start,
            endDate: end
          };

          if (groupId === "96801028") {
            employees[currentNik].soft.push(item);
          } else {
            employees[currentNik].technical.push(item);
          }
        }
      }
    }
  }

  // Deduplicate entries for each employee to get the active / latest proficiency per qualification
  for (const nik of Object.keys(employees)) {
    const emp = employees[nik];

    // For soft competencies: pick latest (by endDate DESC, startDate DESC)
    const softMap = new Map<string, CompetencyItem>();
    for (const item of emp.soft) {
      const existing = softMap.get(item.qualId);
      if (!existing) {
        softMap.set(item.qualId, item);
      } else {
        if (item.endDate.startsWith("9999") && !existing.endDate.startsWith("9999")) {
          softMap.set(item.qualId, item);
        } else if (item.startDate > existing.startDate) {
          softMap.set(item.qualId, item);
        }
      }
    }
    emp.soft = Array.from(softMap.values());

    // For technical competencies: pick latest (by endDate DESC, startDate DESC)
    const techMap = new Map<string, CompetencyItem>();
    for (const item of emp.technical) {
      const key = `${item.groupId}-${item.qualId}`;
      const existing = techMap.get(key);
      if (!existing) {
        techMap.set(key, item);
      } else {
        if (item.endDate.startsWith("9999") && !existing.endDate.startsWith("9999")) {
          techMap.set(key, item);
        } else if (item.startDate > existing.startDate) {
          techMap.set(key, item);
        }
      }
    }
    emp.technical = Array.from(techMap.values());
  }

  return { groups, proficiencies, employees };
}

function run() {
  const result = parseCompetencyMarkdown(MD_PATH);
  const outDir = path.dirname(OUTPUT_JSON_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(result, null, 2), "utf-8");
  console.log(`Saved parsed competencies to ${OUTPUT_JSON_PATH}`);
  const stats = fs.statSync(OUTPUT_JSON_PATH);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
}

if (require.main === module) {
  run();
}
