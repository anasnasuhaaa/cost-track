import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>;
}
