/**
 * Utility to extract, format, and filter multi-year comments / feedback (e.g. 360 review comments,
 * supervisor notes, strengths, and weaknesses) based on the current active year.
 */

export type DatedCommentEntry = {
  year: number | null;
  content: string;
};

/**
 * Splits a concatenated text containing multiple timestamped entries into structured items with their respective years.
 * Matches formats such as:
 * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
 * - YYYY MM DD
 * - DD-MM-YYYY, DD/MM/YYYY
 * - [YYYY], (YYYY), YYYY - ...
 */
export function extractEntriesWithDates(text: string): DatedCommentEntry[] {
  if (!text || !text.trim()) return [];

  const normalized = text.trim();

  // Regular expression detecting starting points of dates
  const dateRegex = /(?:(\b(?:19|20)\d{2})[-/.]\d{1,2}[-/.]\d{1,2}\b)|(?:(\b(?:19|20)\d{2})\s+\d{1,2}\s+\d{1,2}\b)|(?:\b\d{1,2}[-/.]\d{1,2}[-/.]((?:19|20)\d{2})\b)|(?:\[((?:19|20)\d{2})\])|\b((?:19|20)\d{2})\s*-\s*/g;

  const matches: Array<{ index: number; year: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = dateRegex.exec(normalized)) !== null) {
    const yearStr = match[1] || match[2] || match[3] || match[4] || match[5];
    if (yearStr) {
      matches.push({
        index: match.index,
        year: parseInt(yearStr, 10),
      });
    }
  }

  // If no dates found at all, return the whole text as year: null
  if (matches.length === 0) {
    return [{ year: null, content: normalized }];
  }

  const entries: DatedCommentEntry[] = [];

  // Prefix content before first date, if any
  if (matches[0].index > 0) {
    const prefix = normalized.slice(0, matches[0].index).trim();
    if (prefix) {
      entries.push({ year: null, content: prefix });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].index;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
    const content = normalized.slice(startIndex, endIndex).trim();
    if (content) {
      entries.push({
        year: matches[i].year,
        content,
      });
    }
  }

  return entries;
}

/**
 * Filters a string or array of comment strings to ONLY include comments from the current active year (e.g. 2026, 2027).
 * If no entries match the current year, returns the fallback string.
 */
export function filterCommentsForCurrentYear(
  value: string | string[] | null | undefined,
  targetYear: number = new Date().getFullYear(),
  fallback: string = `Belum ada komentar untuk tahun ${targetYear}`
): string {
  if (!value) return fallback;

  const rawTexts = Array.isArray(value) ? value : [String(value)];
  const allEntries: DatedCommentEntry[] = [];

  for (const raw of rawTexts) {
    if (!raw) continue;
    allEntries.push(...extractEntriesWithDates(raw));
  }

  if (!allEntries.length) return fallback;

  const hasDatedEntries = allEntries.some((e) => e.year !== null);

  if (!hasDatedEntries) {
    // If no dates exist at all in any entry, display all content
    return allEntries.map((e) => e.content).join("\n");
  }

  // Filter for entries matching the active year
  const matchingEntries = allEntries.filter((e) => e.year === targetYear);

  if (matchingEntries.length > 0) {
    return matchingEntries.map((e) => e.content).join("\n");
  }

  return fallback;
}

export type Curated360Comment = {
  raw: string;
  date: string | null;
  text: string;
  isImprovement: boolean;
};

export type Curated360Result = {
  totalCount: number;
  relevantCount: number;
  filteredCount: number;
  comments: Curated360Comment[];
  summary: string;
  hasComments: boolean;
};

const NOISE_PATTERN = /(?:pelari|kalcer|pace\s*keong|cuan|ngelirik|envirosultan|cak\s*nji|bingiiit|goyangan|abang\s*bedul|biji\s*biji|seger\s*banget|pemandangan\s*indah|tidak\s*satu\s*atap|satu\s*atap\s*lagi|wkwk|hehe|haha|xixi|huhu|pantun|curhat|om\s+[a-z]+|tante\s+[a-z]+|dibanding\s+pak)/i;
const EMPTY_OR_FILLER_PATTERN = /^(?:muantap|mantap|mantul|sangat\s*baik|baik|cukup|sudah\s*baik|bagus|oke|ok|sip|siap|yes|nope|nill|none|null|no\s*comment|tidak\s*ada|belum\s*ada|no\s*further\s*comment|\.|\-)$/i;
const WORK_SUBSTANCE_PATTERN = /(?:analis|berpikir|kritis|tanggung\s*jawab|tugas|kerja\s*sama|komunikasi|kooperatif|inisiatif|proaktif|kepemimpinan|leadership|kinerja|proyek|project|disiplin|solusi|belajar|speaking|keputusan|mandiri|visioner|attitude|sikap|integritas|kompeten|expert|network|sharing|bimbingan|mentoring|koordinasi|pengetahuan|knowledge|teknikal|technical|reliable|responsive|dedicated|helpful)/i;
const DATE_PREFIX_REGEX = /^\s*(?:\[?(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\]?|\[?\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\]?|\[?(?:19|20)\d{2}\]?)\s*[-–:]\s*/;
const EXTRACT_DATE_REGEX = /(?:(\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b)|(\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b)|(\b(?:19|20)\d{2}\b))/;

function buildSummaryParagraph(strengths: string[], improvements: string[], year: number): string {
  const parts: string[] = [];

  if (strengths.length > 0) {
    const strengthThemes: string[] = [];
    const joined = strengths.join(" ").toLowerCase();

    if (joined.includes("kritis") || joined.includes("analisis") || joined.includes("data")) {
      strengthThemes.push("kemampuan berpikir kritis dan analisis data yang mendalam");
    }
    if (joined.includes("komunikasi") || joined.includes("kooperatif") || joined.includes("pendekatan")) {
      strengthThemes.push("sikap kooperatif serta komunikasi yang efektif dengan rekan kerja maupun atasan");
    }
    if (joined.includes("tanggung jawab") || joined.includes("terorganisir") || joined.includes("mengelola tugas")) {
      strengthThemes.push("rasa tanggung jawab tinggi dan manajemen tugas yang terorganisir");
    }
    if (joined.includes("semangat") || joined.includes("positif") || joined.includes("menyerah") || joined.includes("kerja sama")) {
      strengthThemes.push("sikap kerja positif serta dedikasi pantang menyerah dalam kolaborasi tim");
    }
    if (joined.includes("expert") || joined.includes("kompeten") || joined.includes("knowledge") || joined.includes("wawasan") || joined.includes("teknikal")) {
      strengthThemes.push("penguasaan keahlian teknis dan wawasan operasional yang solid");
    }
    if (joined.includes("network") || joined.includes("jejaring") || joined.includes("hubungan")) {
      strengthThemes.push("kemampuan membangun relasi dan jejaring kerja yang konstruktif");
    }

    if (strengthThemes.length > 0) {
      parts.push(`Berdasarkan evaluasi umpan balik 360° tahun ${year}, karyawan diapresiasi tinggi atas ${strengthThemes.slice(0, 3).join(", serta ")}.`);
    } else {
      const cleanFirst = strengths[0].replace(/[.,]+$/, "");
      parts.push(`Berdasarkan evaluasi umpan balik 360° tahun ${year}, karyawan menerima umpan balik positif dari rekan kerja dan atasan, khususnya terkait ${cleanFirst.toLowerCase()}.`);
    }
  }

  if (improvements.length > 0) {
    const improvementThemes: string[] = [];
    const joinedImp = improvements.join(" ").toLowerCase();

    if (joinedImp.includes("analisa bisnis") || joinedImp.includes("bisnis") || joinedImp.includes("holistik")) {
      improvementThemes.push("penguatan pemahaman analisa bisnis dan penyelesaian masalah secara holistik");
    }
    if (joinedImp.includes("mandiri") || joinedImp.includes("pengambilan keputusan") || joinedImp.includes("visioner")) {
      improvementThemes.push("kemandirian serta visi strategis dalam pengambilan keputusan");
    }
    if (joinedImp.includes("public speaking") || joinedImp.includes("bicara") || joinedImp.includes("presentasi")) {
      improvementThemes.push("pengembangan keterampilan public speaking dan artikulasi gagasan di forum resmi");
    }
    if (joinedImp.includes("sharing") || joinedImp.includes("bimbingan") || joinedImp.includes("junior")) {
      improvementThemes.push("peningkatan transfer knowledge dan pembimbingan bagi anggota tim junior");
    }
    if (joinedImp.includes("vokal") || joinedImp.includes("vocal") || joinedImp.includes("proaktif")) {
      improvementThemes.push("keberanian menyampaikan inisiatif dan bersikap lebih proaktif");
    }

    if (improvementThemes.length > 0) {
      parts.push(`Sebagai fokus area pengembangan ke depan, penilai merekomendasikan ${improvementThemes.slice(0, 2).join(", serta ")}.`);
    } else {
      const cleanFirstImp = improvements[0]
        .replace(/^(?:ybs\s*perlu|perlu|tingkatkan|karyawan\s*perlu)\s*/i, "")
        .replace(/[.,]+$/, "");
      parts.push(`Sebagai fokus area pengembangan ke depan, penilai merekomendasikan peningkatan pada aspek ${cleanFirstImp.toLowerCase()}.`);
    }
  } else if (strengths.length > 0) {
    parts.push(`Secara menyeluruh, rekan kerja dan atasan menilai kinerja serta kerja sama karyawan sudah berjalan dengan sangat baik dan konsisten.`);
  }

  return parts.join(" ");
}

/**
 * Curates 360 evaluation comments for a specific year:
 * 1. Filters out jokes, memes, non-substantive filler comments.
 * 2. Retains only constructive, relevant performance and behavioral feedback.
 * 3. Automatically generates an executive summary paragraph synthesizing strengths and focus development areas.
 */
export function curateAndSummarize360Comments(
  value: string | string[] | null | undefined,
  targetYear: number = new Date().getFullYear(),
  fallbackMessage: string = `Belum ada komentar 360° yang relevan untuk tahun ${targetYear}`
): Curated360Result {
  if (!value) {
    return {
      totalCount: 0,
      relevantCount: 0,
      filteredCount: 0,
      comments: [],
      summary: fallbackMessage,
      hasComments: false,
    };
  }

  const rawTexts = Array.isArray(value) ? value : [String(value)];
  const allEntries: DatedCommentEntry[] = [];

  for (const raw of rawTexts) {
    if (!raw) continue;
    allEntries.push(...extractEntriesWithDates(raw));
  }

  if (!allEntries.length) {
    return {
      totalCount: 0,
      relevantCount: 0,
      filteredCount: 0,
      comments: [],
      summary: fallbackMessage,
      hasComments: false,
    };
  }

  const hasDatedEntries = allEntries.some((e) => e.year !== null);
  const targetEntries = hasDatedEntries
    ? allEntries.filter((e) => e.year === targetYear)
    : allEntries;

  // Flatten entries that might contain internal newline breaks
  const rawCommentLines: string[] = [];
  for (const entry of targetEntries) {
    const lines = entry.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    rawCommentLines.push(...lines);
  }

  const totalCount = rawCommentLines.length;
  const curatedList: Curated360Comment[] = [];
  const strengthTexts: string[] = [];
  const improvementTexts: string[] = [];

  for (const rawLine of rawCommentLines) {
    // Extract date prefix if exists
    const dateMatch = rawLine.match(EXTRACT_DATE_REGEX);
    const dateStr = dateMatch ? dateMatch[0] : null;

    // Clean text by stripping leading date pattern
    const cleaned = rawLine.replace(DATE_PREFIX_REGEX, "").trim();
    if (!cleaned) continue;

    // Filter out jokes, memes, and slang
    if (NOISE_PATTERN.test(cleaned)) continue;

    // Filter out non-substantive fillers
    if (EMPTY_OR_FILLER_PATTERN.test(cleaned)) continue;
    if (/no\s*comment\s*sudah/i.test(cleaned)) continue;
    if (cleaned.length < 20 && !WORK_SUBSTANCE_PATTERN.test(cleaned)) continue;
    if (cleaned.length < 35 && /^sudah\s*baik/i.test(cleaned)) continue;

    const isImp = /(?:perlu|tingkatkan|ditingkatkan|kurang|harus\s*lebih|lebih\s*sering|belajar|benefit\s*from|would\s*benefit|need\s*to|improve|fokuskan|tantangan|koreksi)/i.test(cleaned);

    curatedList.push({
      raw: rawLine,
      date: dateStr,
      text: cleaned,
      isImprovement: isImp,
    });

    if (isImp) {
      improvementTexts.push(cleaned);
    } else {
      strengthTexts.push(cleaned);
    }
  }

  const relevantCount = curatedList.length;
  const filteredCount = totalCount - relevantCount;

  if (relevantCount === 0) {
    return {
      totalCount,
      relevantCount: 0,
      filteredCount,
      comments: [],
      summary: fallbackMessage,
      hasComments: false,
    };
  }

  const summary = buildSummaryParagraph(strengthTexts, improvementTexts, targetYear);

  return {
    totalCount,
    relevantCount,
    filteredCount,
    comments: curatedList,
    summary,
    hasComments: true,
  };
}
