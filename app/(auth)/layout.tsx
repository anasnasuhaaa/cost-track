import { Landmark, LockKeyhole, Sparkles } from "lucide-react";
import { connection } from "next/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <main className="grid min-h-dvh overflow-x-hidden bg-background lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-brand p-12 text-brand-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-accent/15" />
        <div className="absolute left-1/2 top-1/3 size-52 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative flex items-center gap-3 text-lg font-bold">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-foreground text-brand"><Landmark className="size-5" /></span>
          Cost Track
        </div>
        <div className="relative max-w-lg space-y-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent"><Sparkles className="size-4" />Personal finance, made clear</p>
          <h1 className="font-heading text-5xl font-semibold leading-tight">Catat lebih cepat. Pahami uangmu lebih baik.</h1>
          <p className="text-lg leading-8 text-brand-foreground/70">Satu tempat yang tenang untuk transaksi, saldo, dan insight keuangan pribadi.</p>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-brand-foreground/55"><LockKeyhole className="size-4" />Data keuanganmu tetap terisolasi per akun.</p>
      </section>
      <section className="relative flex min-w-0 items-center justify-center px-5 py-10 sm:px-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-accent to-secondary lg:hidden" />
        <div className="w-full min-w-0 max-w-[calc(100vw-2.5rem)] sm:max-w-md">
          <div className="mb-10 flex items-center gap-3 font-heading text-lg font-bold lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Landmark className="size-5" /></span>Cost Track</div>
          {children}
        </div>
      </section>
    </main>
  );
}
