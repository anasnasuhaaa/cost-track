import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { connection } from "next/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await requireUser();
  return <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>;
}
