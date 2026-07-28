"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ReminderType = "PRESENTATION" | "PIC_TASK";

export function ProbationReminderActions({
  profileId,
  channels,
  presentationRecipients,
  picRecipients,
  canSendPresentationReminder,
  canSendPicReminder,
}: {
  profileId: string;
  channels: string[];
  presentationRecipients: string[];
  picRecipients: string[];
  canSendPresentationReminder: boolean;
  canSendPicReminder: boolean;
}) {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<ReminderType | null>(null);

  const sendReminder = async (type: ReminderType, recipients: string[]) => {
    setLoadingType(type);
    try {
      const res = await fetch("/api/admin/probation-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, type, channels, recipients }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Reminder gagal dikirim");
        return;
      }
      toast.success(type === "PRESENTATION" ? "Reminder presentasi dikirim" : "Reminder PIC dikirim");
      router.refresh();
    } catch {
      toast.error("Reminder gagal dikirim");
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="flex min-w-36 flex-col gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canSendPresentationReminder || loadingType !== null}
        onClick={() => sendReminder("PRESENTATION", presentationRecipients)}
        className="justify-start"
      >
        {loadingType === "PRESENTATION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
        Presentasi
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canSendPicReminder || loadingType !== null}
        onClick={() => sendReminder("PIC_TASK", picRecipients)}
        className="justify-start"
      >
        {loadingType === "PIC_TASK" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
        PIC task
      </Button>
    </div>
  );
}
