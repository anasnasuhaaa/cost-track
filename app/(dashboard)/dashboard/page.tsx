import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, ReceiptText, WalletCards } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { QuickAddButton } from "@/components/transactions/quick-add-button";
import { formatRupiah } from "@/lib/finance/calculations";
import { getDashboard } from "@/lib/finance/dashboard";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser();
  const data = await getDashboard(user.id, (await searchParams).period);
  return (
    <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow={`Halo, ${user.name.split(" ")[0]}`}
        title="Ringkasan keuangan"
        description="Lihat yang penting tanpa tenggelam dalam angka."
        action={<PeriodSelector period={data.period} />}
      />

      <section className="rounded-3xl bg-[#102a25] p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm text-emerald-100/70">Total saldo</p><p className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{formatRupiah(data.balance)}</p><p className="mt-3 text-xs text-emerald-100/60">Saldo awal + pemasukan − pengeluaran</p></div>
          <QuickAddButton />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Summary icon={<ArrowUpRight />} label="Pemasukan" value={formatRupiah(data.income)} positive />
        <Summary icon={<ArrowDownRight />} label="Pengeluaran" value={formatRupiah(data.expense)} />
        <Summary icon={<ReceiptText />} label="Jumlah transaksi" value={`${data.transactionCount}`} wide />
      </div>

      <DashboardCharts daily={data.dailyExpenses} categories={data.categoryExpenses} />

      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-5"><div><h2 className="font-heading text-lg font-semibold">Transaksi terbaru</h2><p className="text-sm text-muted-foreground">Aktivitas keuangan paling baru</p></div><Link href="/transactions" className="tap-target flex items-center gap-1 text-sm font-semibold text-primary">Lihat semua <ArrowRight className="size-4" /></Link></div>
        {data.recent.length ? <div className="divide-y">{data.recent.map((item) => <div key={item.id} className="flex items-center gap-3 px-5 py-4"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.type === "INCOME" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{item.type === "INCOME" ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.description}</p><p className="truncate text-xs text-muted-foreground">{item.categoryName} · {item.accountName}</p></div><div className="text-right"><p className={`text-sm font-semibold ${item.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{item.type === "INCOME" ? "+" : "−"}{formatRupiah(item.amount)}</p><p className="text-xs text-muted-foreground">{shortDate(item.transactionDate)}</p></div></div>)}</div> : <div className="px-5 py-14 text-center"><WalletCards className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">Belum ada transaksi.</p><p className="mt-1 text-sm text-muted-foreground">Mulai dengan mencatat transaksi pertama.</p></div>}
      </section>
    </div>
  );
}

function Summary({ icon, label, value, positive = false, wide = false }: { icon: React.ReactNode; label: string; value: string; positive?: boolean; wide?: boolean }) { return <article className={`rounded-2xl border bg-card p-4 sm:p-5 ${wide ? "col-span-2 xl:col-span-1" : ""}`}><span className={`mb-4 grid size-9 place-items-center rounded-xl [&>svg]:size-4 ${positive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{icon}</span><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><p className="mt-1 truncate font-heading text-lg font-semibold sm:text-xl">{value}</p></article>; }
function PeriodSelector({ period }: { period: string }) { const [year, month] = period.split("-").map(Number); const options = Array.from({ length: 6 }, (_, index) => { const date = new Date(Date.UTC(year, month - 1 - index, 1)); const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(date); return { value, label }; }); return <form className="flex gap-2"><label className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><select className="tap-target rounded-xl border bg-card pl-9 pr-8 text-sm font-medium" name="period" defaultValue={period} aria-label="Periode dashboard">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button className="tap-target rounded-xl border bg-card px-3 text-xs font-semibold" type="submit">Terapkan</button></form>; }
function shortDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`)); }
