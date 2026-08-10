import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_2fr]">
      <div className="relative hidden overflow-hidden bg-[hsl(222.2,47.4%,11.2%)] p-10 text-white lg:flex lg:items-center lg:justify-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 25% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2">
              <Image src="/BERAU-LOGO.png" alt="Berau Coal" width={48} height={48} className="h-full w-full object-contain" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2">
              <Image src="/MTL-LOGO.png" alt="MTL" width={48} height={48} className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <p className="text-2xl font-bold tracking-tight">Berau Coal</p>
            <p className="text-sm text-white/70">Probation Monitoring Portal</p>
            <p className="pt-4 text-sm leading-6 text-white/65">
              Secure access for new hire onboarding, probation progress, and final evaluation tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[hsl(210,40%,98%)] p-6 lg:p-12 xl:p-16">
        <div className="w-full max-w-xl">{children}</div>
      </div>
    </div>
  );
}
