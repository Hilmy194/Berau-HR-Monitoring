"use client";

import { SessionProvider } from "next-auth/react";
import ClientToaster from "@/components/ui/client-toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ClientToaster richColors position="top-right" />
    </SessionProvider>
  );
}
