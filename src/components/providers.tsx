"use client";

import { SessionProvider } from "next-auth/react";
import ClientToaster from "@/components/ui/client-toaster";
import { GlobalLoadingProvider } from "@/components/shell/loading-screen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GlobalLoadingProvider>
        {children}
        <ClientToaster richColors position="top-right" />
      </GlobalLoadingProvider>
    </SessionProvider>
  );
}
