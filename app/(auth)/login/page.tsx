import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  if ((await getSession())?.user) redirect("/dashboard");
  return <div><p className="mb-2 text-sm font-semibold text-primary">Selamat datang kembali</p><h2 className="font-heading text-3xl font-semibold tracking-tight">Masuk ke Cost Track</h2><p className="mb-8 mt-3 text-muted-foreground">Lanjutkan melihat kondisi keuanganmu.</p><AuthForm mode="login" /></div>;
}
