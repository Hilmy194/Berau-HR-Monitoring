"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type LoadingState = {
  visible: boolean;
  label: string;
  detail?: string;
};

type LoadingContextValue = {
  showLoading: (label?: string, detail?: string) => void;
  hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<LoadingState>({
    visible: false,
    label: "Memproses",
  });

  const showLoading = useCallback((label = "Memproses", detail?: string) => {
    setLoading({ visible: true, label, detail });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading((current) => ({ ...current, visible: false }));
  }, []);

  const value = useMemo(() => ({ showLoading, hideLoading }), [hideLoading, showLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay loading={loading} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    return {
      showLoading: () => undefined,
      hideLoading: () => undefined,
    };
  }
  return context;
}

function LoadingOverlay({ loading }: { loading: LoadingState }) {
  if (!loading.visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <div className="absolute inset-2 flex items-center justify-center rounded-xl bg-white text-lg font-black text-emerald-700">
              H
            </div>
          </div>
        </div>
        <h2 className="mt-5 text-base font-bold text-slate-950">{loading.label}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {loading.detail ?? "Mohon tunggu sebentar, sistem sedang menyiapkan data."}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Harmoni
        </div>
      </div>
    </div>
  );
}
