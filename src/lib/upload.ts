import path from "node:path";
import { promises as fs } from "node:fs";

/**
 * File upload helpers.
 *
 * Uploads are stored on the local filesystem under `/public/uploads` for the
 * v1 implementation (zero-config, works on SQLite dev setup). The public URL
 * is then constructed from the file's relative path so the same value can be
 * stored in `Profile.cvUrl`, `Profile.photoUrl`, or
 * `ProbationTask.attachmentUrl` and rendered directly by <img>/<a> tags.
 *
 * The validation rules below intentionally cover US-04 acceptance criteria:
 *   - Allowed file types are validated.
 *   - File size is limited.
 *   - Files are written outside of the request handler in a single place so
 *     we can later swap the storage backend (S3, GCS, …) without touching
 *     every route.
 */

/** Absolute path to the uploads directory inside `/public`. */
export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/** Public URL prefix that maps 1:1 to UPLOADS_DIR. */
export const UPLOADS_PUBLIC_PREFIX = "/uploads";

/** Maximum accepted upload size: 5 MB. */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export type UploadKind = "cv" | "photo" | "task";

/**
 * Minimal structural shape of a `File`/`Blob` as produced by `FormData` on
 * the server. We deliberately avoid referencing the global `File` type here
 * because it does not exist on Node 18 at runtime (only the TypeScript DOM
 * lib declares it), so `instanceof File` throws `ReferenceError` there.
 */
export interface UploadableFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface UploadRule {
  /** Allowed MIME types. */
  allowedMime: readonly string[];
  /** Allowed lowercase extensions (without the leading dot). */
  allowedExt: readonly string[];
  /** Human-readable label used in error messages. */
  label: string;
}

const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  cv: {
    allowedMime: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    allowedExt: ["pdf", "doc", "docx"],
    label: "PDF, DOC, or DOCX",
  },
  photo: {
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
    allowedExt: ["jpg", "jpeg", "png", "webp"],
    label: "JPG, PNG, or WEBP",
  },
  task: {
    allowedMime: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
      "application/zip",
    ],
    allowedExt: [
      "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
      "jpg", "jpeg", "png", "webp", "txt", "zip",
    ],
    label: "PDF, Office, image, TXT, or ZIP",
  },
};

export interface SavedFile {
  /** Public URL that can be stored on a record and rendered in the UI. */
  url: string;
  /** Original file name as uploaded by the user (kept for display). */
  originalName: string;
  /** Size in bytes. */
  size: number;
  /** Final on-disk filename (unique, namespaced). */
  fileName: string;
}

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/**
 * Persist a single uploaded file to disk and return its public URL.
 *
 * Throws UploadValidationError for any validation failure so the caller can
 * map it to a 400 response without leaking internals.
 *
 * @param file File received from a `Request.formData()` call.
 * @param kind Controls the allowed types / extensions.
 * @param namespace Optional sub-folder (e.g. the related entity id) to keep
 *                  the uploads directory organised and avoid name collisions.
 */
export async function saveUpload(
  file: UploadableFile,
  kind: UploadKind,
  namespace?: string,
): Promise<SavedFile> {
  const rule = UPLOAD_RULES[kind];

  if (file.size === 0) {
    throw new UploadValidationError("The selected file is empty.");
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new UploadValidationError("File is too large (max 5 MB).");
  }

  const originalName = file.name || "upload";
  const ext = path.extname(originalName).replace(/^\./, "").toLowerCase();

  // Trust the declared MIME type when present, fall back to the extension.
  const mimeOk = file.type ? rule.allowedMime.includes(file.type) : false;
  const extOk = rule.allowedExt.includes(ext);
  if (!mimeOk && !extOk) {
    throw new UploadValidationError(
      `Unsupported file type. Allowed: ${rule.label}.`,
    );
  }

  const safeExt = ext && rule.allowedExt.includes(ext) ? `.${ext}` : "";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const baseName = `${kind}_${timestamp}_${random}${safeExt}`;

  // Optional namespace sub-folder keeps per-entity uploads grouped.
  const subDir = namespace
    ? path.join(UPLOADS_DIR, sanitizeSegment(namespace))
    : UPLOADS_DIR;
  await fs.mkdir(subDir, { recursive: true });

  const finalPath = path.join(subDir, baseName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(finalPath, buffer);

  // Build the public URL relative to /public.
  const relative = path.relative(path.join(process.cwd(), "public"), finalPath);
  const url = `/${relative.split(path.sep).join("/")}`;

  return {
    url,
    originalName,
    size: file.size,
    fileName: baseName,
  };
}

/**
 * Removes a previously uploaded file from disk. Failures are swallowed
 * because the database is the source of truth — a missing file should not
 * block a profile/task update.
 */
export async function removeUpload(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(UPLOADS_PUBLIC_PREFIX)) return;
  const abs = path.join(process.cwd(), "public", url);
  try {
    await fs.unlink(abs);
  } catch {
    // Ignore — file may already be gone or never existed.
  }
}

/** Sanitise a single path segment (no slashes / dots) so it's safe to join. */
function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "misc";
}

/** Pretty-print a byte size for UI display. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
