import { Landmark } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#102a25] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-emerald-400/10" />
        <div className="relative flex items-center gap-3 text-lg font-bold">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-400 text-[#102a25]"><Landmark className="size-5" /></span>
          Cost Track
        </div>
        <div className="relative max-w-lg space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Personal finance, made clear</p>
          <h1 className="font-heading text-5xl font-semibold leading-tight">Catat lebih cepat. Pahami uangmu lebih baik.</h1>
          <p className="text-lg leading-8 text-emerald-50/70">Satu tempat yang tenang untuk transaksi, saldo, dan insight keuangan pribadi.</p>
        </div>
        <p className="relative text-sm text-emerald-50/50">Data keuanganmu tetap terisolasi per akun.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10"><div className="w-full max-w-md">{children}</div></section>
    </main>
  );
}
