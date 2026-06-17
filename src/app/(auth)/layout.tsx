import { Building2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[hsl(222.2,47.4%,11.2%)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold">HR Digital</p>
            <p className="text-xs text-white/60">Probation Monitoring System</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Onboarding & Probation,<br />made transparent.
          </h2>
          <p className="text-white/70 max-w-md">
            Track probation activities, monitor progress, and manage final presentations —
            all in one place. A focused, lightweight system for new hires and HR.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Probation", value: "100 days" },
              { label: "Modules", value: "Tasks + Presentation" },
              { label: "Roles", value: "HR + Employee" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-white/5 p-3">
                <p className="text-sm font-semibold">{s.value}</p>
                <p className="text-[11px] text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} HR Digital. Internal use only.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-[hsl(210,40%,98%)]">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
