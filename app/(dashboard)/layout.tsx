import { requireUser } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <main className="min-h-dvh">{children}</main>;
}
