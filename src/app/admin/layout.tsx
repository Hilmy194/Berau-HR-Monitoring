import { requireAdmin } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";
import { NAV_ITEMS } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <AppShell user={session.user} items={[...NAV_ITEMS.admin]}>
      {children}
    </AppShell>
  );
}
