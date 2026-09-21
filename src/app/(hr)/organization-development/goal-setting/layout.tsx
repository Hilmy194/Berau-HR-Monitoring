import { requireGoalSettingAccess } from "@/lib/session";

export default async function GoalSettingLayout({ children }: { children: React.ReactNode }) {
  await requireGoalSettingAccess();
  return children;
}
