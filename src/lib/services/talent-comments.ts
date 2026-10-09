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
