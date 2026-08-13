"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileText, Loader2, Search, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CompetencyShareFileItem } from "@/lib/services/organization-development.service";

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompetencyFileUpload({ files }: { files: CompetencyShareFileItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;
    return files.filter((file) =>
      [
        file.originalName,
        file.uploadedBy ?? "",
        file.mimeType ?? "",
      ].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [files, query]);

  const upload = async (selectedFiles: FileList | File[]) => {
    const uploadFiles = Array.from(selectedFiles);
    if (uploadFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/organization-development/competency-files", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }

      toast.success(uploadFiles.length === 1 ? "File uploaded" : `${uploadFiles.length} files uploaded`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUploading(false);
      setDragOver(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Shared Competency Files</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Upload dokumen competency agar bisa dipakai dan di-download oleh user lain di workspace OD.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={(event) => {
            if (event.target.files) upload(event.target.files);
          }}
          className="hidden"
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            upload(event.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-5 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold">{uploading ? "Uploading files..." : "Upload or drag files here"}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Bisa upload beberapa file sekaligus. PDF, Office, CSV, TXT, atau ZIP maksimal 5 MB per file.
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-lg border bg-slate-50/60">
        <div className="border-b bg-white p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search file"
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {files.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Belum ada file competency yang dibagikan.
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            File tidak ditemukan.
          </div>
        ) : (
          <div className="max-h-[216px] overflow-y-auto divide-y">
            {filteredFiles.map((file) => (
              <div key={file.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-primary ring-1 ring-border">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{file.originalName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)} - Uploaded by {file.uploadedBy ?? "Unknown"} - {new Date(file.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <a href={file.fileUrl} download>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


