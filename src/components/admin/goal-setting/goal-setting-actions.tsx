"use client";

import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GoalExportButton({ csv, filename = "goal-setting-export.csv" }: { csv: string; filename?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="h-4 w-4" /> Export Data
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
