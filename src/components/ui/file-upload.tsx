"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileCheck2, X, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  /** Upload endpoint URL. */
  endpoint: string;
  /** HTTP method for upload. Default "POST". */
  method?: "POST" | "PUT";
  /** Optional extra field name to send with the file (e.g. "kind" or "type"). */
  fieldName?: string;
  /** Value of the extra field. */
  fieldValue?: string;
  /** Currently stored file URL (if any). */
  currentUrl?: string | null;
  /** Currently stored display name. */
  currentName?: string | null;
  /** Delete endpoint URL. If omitted, the remove button is hidden. */
  deleteEndpoint?: string;
  /** Allowed accept hint for the OS file picker. */
  accept?: string;
  /** Friendly label shown in the drop area. */
  label?: string;
  /** Helper text shown under the label. */
  hint?: string;
  /** Compact mode renders an inline button instead of a drop area. */
  compact?: boolean;
  /** Optional callback after a successful upload. */
  onUploaded?: (data: { url: string; originalName?: string; size?: number }) => void;
}

/**
 * Generic client-side file uploader used for CV, photo, and task attachments.
 *
 * The component is intentionally dumb: it just POSTs the chosen file as
 * multipart/form-data to the given endpoint and lets the route handler deal
 * with validation + storage. This keeps storage concerns server-side and
 * makes the component trivially reusable.
 */
export function FileUpload({
  endpoint,
  method = "POST",
  fieldName = "kind",
  fieldValue,
  currentUrl,
  currentName,
  deleteEndpoint,
  accept,
  label = "Click to upload or drag & drop",
  hint,
  compact = false,
  onUploaded,
}: FileUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileUrl, setFileUrl] = useState(currentUrl);
  const [fileName, setFileName] = useState(currentName);

  useEffect(() => {
    setFileUrl(currentUrl);
    setFileName(currentName);
  }, [currentUrl, currentName]);

  const hasFile = !!fileUrl;

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (fieldValue) formData.append(fieldName, fieldValue);

      const res = await fetch(endpoint, { method, body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      toast.success("File uploaded");
      setFileUrl(data.url ?? data.attachmentUrl ?? null);
      setFileName(data.originalName ?? data.attachmentName ?? file.name);
      onUploaded?.({
        url: data.url ?? data.attachmentUrl,
        originalName: data.originalName ?? data.attachmentName,
        size: data.size,
      });
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!deleteEndpoint) return;
    setRemoving(true);
    const previousUrl = fileUrl;
    const previousName = fileName;
    setFileUrl(null);
    setFileName(null);
    try {
      const res = await fetch(deleteEndpoint, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFileUrl(previousUrl);
        setFileName(previousName);
        toast.error(data.error ?? "Failed to remove file");
        return;
      }
      toast.success("File removed");
      router.refresh();
    } catch {
      setFileUrl(previousUrl);
      setFileName(previousName);
      toast.error("Something went wrong");
    } finally {
      setRemoving(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
        {hasFile ? (
          <>
            <a
              href={fileUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              {fileName ?? "View file"}
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Replace
            </Button>
            {deleteEndpoint && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={removing}
                onClick={remove}
                className="text-destructive hover:text-destructive"
              >
                {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Remove
              </Button>
            )}
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
            Upload
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
      {hasFile ? (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={fileUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{fileName ?? "View uploaded file"}</span>
              </a>
              {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Replace</span>
              </Button>
              {deleteEndpoint && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={removing}
                  onClick={remove}
                  className="text-destructive hover:text-destructive"
                >
                  {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">{uploading ? "Uploading..." : label}</p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
