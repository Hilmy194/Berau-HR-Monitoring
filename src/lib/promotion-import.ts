export const PROMOTION_IMPORT_HEADERS = [
  "employee_id",
  "employee_name",
  "current_position",
  "directorate",
  "division",
  "department",
  "last_promotion_date",
  "time_in_position_years",
  "next_status",
  "pic_name",
  "promotion_status",
] as const;

export const PROMOTION_STATUSES = [
  "Submitted",
  "Approved Div. Head",
  "Verified by HRBP",
  "Verified by HROD",
  "Approved Dir./Bus. Head",
  "Rejected",
] as const;

export type PromotionImportRow = {
  employeeId: string;
  employeeName: string;
  positionName: string;
  directorateName: string;
  divisionName: string;
  departmentName: string;
  lastPromotionDate: Date | null;
  yearOfServicePosition: number | null;
  nextStatus: string | null;
  picName: string | null;
  promotionStatus: string;
};

export class PromotionImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromotionImportValidationError";
  }
}

export function promotionTemplateCsv() {
  return `\uFEFF${PROMOTION_IMPORT_HEADERS.join(",")}\r\n`;
}

export function parsePromotionCsv(content: string): PromotionImportRow[] {
  const delimiter = detectDelimiter(content);
  const table = parseCsv(content.replace(/^\uFEFF/, ""), delimiter);
  if (table.length === 0) throw new PromotionImportValidationError("File CSV kosong.");

  const headers = table[0].map(normalizeHeader);
  const duplicateHeaders = headers.filter((header, index) => header && headers.indexOf(header) !== index);
  if (duplicateHeaders.length) {
    throw new PromotionImportValidationError(`Header duplikat: ${Array.from(new Set(duplicateHeaders)).join(", ")}.`);
  }

  const missingHeaders = PROMOTION_IMPORT_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new PromotionImportValidationError(`Kolom template tidak lengkap: ${missingHeaders.join(", ")}. Download dan gunakan template terbaru.`);
  }

  const column = Object.fromEntries(PROMOTION_IMPORT_HEADERS.map((header) => [header, headers.indexOf(header)])) as Record<(typeof PROMOTION_IMPORT_HEADERS)[number], number>;
  const dataRows = table.slice(1).filter((row) => row.some((cell) => clean(cell)));
  if (dataRows.length === 0) throw new PromotionImportValidationError("File belum berisi data promosi.");
  if (dataRows.length > 5000) throw new PromotionImportValidationError("Maksimal 5.000 baris per upload.");

  const errors: string[] = [];
  const seen = new Set<string>();
  const rows: PromotionImportRow[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const value = (header: (typeof PROMOTION_IMPORT_HEADERS)[number]) => clean(row[column[header]]);
    const employeeId = value("employee_id");
    const employeeName = value("employee_name");
    const positionName = value("current_position");
    const directorateName = value("directorate");
    const divisionName = value("division");
    const departmentName = value("department");
    const rawStatus = value("promotion_status");
    const rawNextStatus = value("next_status");

    const required = [
      ["employee_id", employeeId],
      ["employee_name", employeeName],
      ["current_position", positionName],
      ["directorate", directorateName],
      ["division", divisionName],
      ["department", departmentName],
      ["promotion_status", rawStatus],
    ].filter(([, item]) => !item).map(([name]) => name);
    if (required.length) errors.push(`Baris ${rowNumber}: wajib diisi ${required.join(", ")}.`);

    const promotionStatus = normalizeStatus(rawStatus);
    if (rawStatus && !promotionStatus) {
      errors.push(`Baris ${rowNumber}: promotion_status \"${rawStatus}\" tidak valid.`);
    }
    const nextStatus = rawNextStatus ? normalizeStatus(rawNextStatus) : null;
    if (rawNextStatus && !nextStatus) {
      errors.push(`Baris ${rowNumber}: next_status \"${rawNextStatus}\" tidak valid.`);
    }

    const lastPromotionDate = parseDate(value("last_promotion_date"));
    if (value("last_promotion_date") && !lastPromotionDate) {
      errors.push(`Baris ${rowNumber}: last_promotion_date harus berformat YYYY-MM-DD.`);
    }
    const yearOfServicePosition = parseYears(value("time_in_position_years"));
    if (value("time_in_position_years") && yearOfServicePosition === null) {
      errors.push(`Baris ${rowNumber}: time_in_position_years harus berupa angka 0-100.`);
    }

    const duplicateKey = `${employeeId.toLocaleLowerCase("id-ID")}::${positionName.toLocaleLowerCase("id-ID")}`;
    if (employeeId && positionName && seen.has(duplicateKey)) {
      errors.push(`Baris ${rowNumber}: kombinasi employee_id dan current_position duplikat.`);
    }
    seen.add(duplicateKey);

    const lengthError = [
      ["employee_id", employeeId, 80],
      ["employee_name", employeeName, 200],
      ["current_position", positionName, 250],
      ["directorate", directorateName, 250],
      ["division", divisionName, 250],
      ["department", departmentName, 250],
      ["pic_name", value("pic_name"), 200],
    ].find(([, item, max]) => String(item).length > Number(max));
    if (lengthError) errors.push(`Baris ${rowNumber}: ${lengthError[0]} terlalu panjang (maksimal ${lengthError[2]} karakter).`);

    rows.push({
      employeeId,
      employeeName,
      positionName,
      directorateName,
      divisionName,
      departmentName,
      lastPromotionDate,
      yearOfServicePosition,
      nextStatus,
      picName: value("pic_name") || null,
      promotionStatus: promotionStatus ?? rawStatus,
    });
  });

  if (errors.length) {
    const shown = errors.slice(0, 8);
    const remainder = errors.length - shown.length;
    throw new PromotionImportValidationError(`${shown.join(" ")}${remainder ? ` Masih ada ${remainder} error lain.` : ""}`);
  }

  return rows;
}

function parseCsv(content: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) throw new PromotionImportValidationError("Format CSV tidak valid: tanda kutip tidak ditutup.");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((items, index) => index === 0 || items.some((item) => clean(item)));
}

function detectDelimiter(content: string) {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;
  for (const character of content.replace(/^\uFEFF/, "")) {
    if (character === '"') quoted = !quoted;
    else if (!quoted && character === ",") commas += 1;
    else if (!quoted && character === ";") semicolons += 1;
    else if (!quoted && (character === "\n" || character === "\r")) break;
  }
  return semicolons > commas ? ";" : ",";
}

function normalizeHeader(value: string) {
  return clean(value).toLocaleLowerCase("id-ID").replace(/[\s-]+/g, "_");
}

function normalizeStatus(value: string) {
  const normalized = clean(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, " ").trim();
  return PROMOTION_STATUSES.find((status) => status.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, " ").trim() === normalized) ?? null;
}

function parseYears(value: string) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

function parseDate(value: string) {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const parts = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : local
      ? [Number(local[3]), Number(local[2]), Number(local[1])]
      : null;
  if (!parts) return null;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function clean(value: string | null | undefined) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
