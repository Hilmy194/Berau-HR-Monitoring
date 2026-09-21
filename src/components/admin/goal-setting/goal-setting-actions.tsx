"use client";

import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GoalExportButton({ href, filename = "goal-setting-export.csv" }: { href: string; filename?: string }) {
  return (
    <Button asChild variant="outline">
      <a href={href} download={filename}><Download className="h-4 w-4" /> Export Data</a>
    </Button>
  );
}

export function GoalSyncButton() {
  return (
    <Button
      type="button"
      onClick={async () => {
        try {
          const response = await fetch("/api/organization-development/goal-sync", { method: "POST" });
          if (!response.ok) throw new Error("Sync failed");
          toast.success("Simulasi sync Entomo berhasil");
        } catch {
          toast.error("Gagal menjalankan simulasi sync Entomo");
        }
      }}
    >
      <RefreshCw className="h-4 w-4" /> Sync from Entomo
    </Button>
  );
}
