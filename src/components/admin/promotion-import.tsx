"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PromotionImport({ canEdit }: { canEdit: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/talent/promotion-import", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error ?? "Upload data promosi gagal.");
        return;
      }
      toast.success(`${result.imported} data promosi berhasil diimpor. Data lama (${result.removed}) telah diganti.`);
      router.refresh();
    } catch {
      toast.error("Upload data promosi gagal. Silakan coba lagi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Import Data Promotion</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Download template CSV, isi satu baris per employee, lalu upload kembali. Upload yang berhasil akan mengganti seluruh daftar Promotion saat ini.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Status: Submitted, Approved Div. Head, Verified by HRBP, Verified by HROD, Approved Dir./Bus. Head, atau Rejected. Maksimal 2 MB.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <a href="/api/talent/promotion-import" download>
              <Download className="h-4 w-4" />
              Download Template
            </a>
          </Button>
          {canEdit ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <Button disabled={uploading} onClick={() => inputRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {uploading ? "Mengimpor..." : "Upload CSV"}
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
