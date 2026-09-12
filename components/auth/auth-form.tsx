"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const result = isRegister
      ? await authClient.signUp.email({ email, password, name: String(data.get("name") ?? "").trim() })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(isRegister ? "Akun belum dapat dibuat. Periksa data atau coba lagi." : "Email atau kata sandi tidak sesuai.");
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {isRegister ? <AuthField icon={<UserRound />} label="Nama" name="name" autoComplete="name" placeholder="Nama kamu" /> : null}
      <AuthField icon={<Mail />} label="Email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" />
      <AuthField icon={<LockKeyhole />} label="Kata sandi" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Minimal 8 karakter" minLength={8} />
      {error ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "Memproses..." : isRegister ? "Buat akun" : "Masuk"}
        {!pending ? <ArrowRight className="size-4" /> : null}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Link className="font-semibold text-foreground hover:underline" href={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar"}</Link>
      </p>
    </form>
  );
}

function AuthField({ icon, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`auth-${props.name}`}>{label}</Label>
      <span className="relative block">
        <span className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">{icon}</span>
        <Input id={`auth-${props.name}`} className="h-12 pl-10" required {...props} />
      </span>
    </div>
  );
}
