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
          <div className="flex h-28 items-center justify-center rounded-2xl bg-white px-4 py-2">
            <Image
              src="/harmoni-logo-with-script-fit.png"
              alt="Harmoni Human Resources Monitoring"
              width={320}
              height={108}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="mt-7 space-y-2">
            <p className="text-sm leading-6 text-white/65">
              Secure access for HR operations, workforce monitoring, and employee development tracking.
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
