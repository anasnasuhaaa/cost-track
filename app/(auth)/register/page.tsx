import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Daftar" };

export default async function RegisterPage() {
  if ((await getSession())?.user) redirect("/dashboard");
  if (process.env.SIGNUP_ENABLED === "false") redirect("/login");
  return <div><p className="mb-2 text-sm font-semibold text-primary">Mulai dengan rapi</p><h2 className="font-heading text-3xl font-semibold tracking-tight">Buat akun pribadi</h2><p className="mb-8 mt-3 text-muted-foreground">Akun Cash akan disiapkan otomatis untukmu.</p><AuthForm mode="register" /></div>;
}
