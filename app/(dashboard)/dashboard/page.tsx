import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ReceiptText, WalletCards } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { PageHeader } from "@/components/layout/page-header";
import { QuickAddButton } from "@/components/transactions/quick-add-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/finance/calculations";
import { getDashboard } from "@/lib/finance/dashboard";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser();
  const data = await getDashboard(user.id, (await searchParams).period);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow={`Halo, ${user.name.split(" ")[0]}`}
        title="Ringkasan keuangan"
        action={<PeriodSelector period={data.period} />}
      />

      <section className="balance-card relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-14 -top-20 size-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-20 size-40 rounded-full bg-accent/15" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/75">Total saldo</p>
            <p className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{formatRupiah(data.balance)}</p>
          </div>
                <QuickAddButton inverse />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Summary icon={<ArrowUpRight />} label="Pemasukan" value={formatRupiah(data.income)} tone="income" />
        <Summary icon={<ArrowDownRight />} label="Pengeluaran" value={formatRupiah(data.expense)} tone="expense" />
        <Summary icon={<ReceiptText />} label="Jumlah transaksi" value={`${data.transactionCount}`} wide />
      </section>

      <DashboardCharts daily={data.dailyExpenses} categories={data.categoryExpenses} />

      <Card>
        <CardHeader className="border-b sm:grid-cols-[1fr_auto]">
          <div>
            <CardTitle className="text-lg">Transaksi terbaru</CardTitle>
          </div>
          <Button className="hidden sm:inline-flex" variant="ghost" render={<Link href="/transactions" />}>
            Lihat semua <ArrowRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {data.recent.length ? (
            <div className="divide-y">
              {data.recent.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/45 sm:px-5">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.type === "INCOME" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {item.type === "INCOME" ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.description}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.categoryName} · {item.accountName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${item.type === "INCOME" ? "text-success" : "text-foreground"}`}><span className="sr-only">{item.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</span>{item.type === "INCOME" ? "+" : "−"}{formatRupiah(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{shortDate(item.transactionDate)}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 pt-3 sm:hidden"><Button className="w-full" variant="outline" render={<Link href="/transactions" />}>Lihat semua transaksi<ArrowRight /></Button></div>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><WalletCards className="size-6" /></span>
              <p className="mt-4 font-semibold">Belum ada transaksi</p>
              <p className="mt-1 text-sm text-muted-foreground">Mulai catat pemasukan atau pengeluaran pertamamu.</p>
              <div className="mt-5 flex justify-center [&_button]:bg-primary [&_button]:text-primary-foreground"><QuickAddButton /></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ icon, label, value, tone, wide = false }: { icon: React.ReactNode; label: string; value: string; tone?: "income" | "expense"; wide?: boolean }) {
  const iconClass = tone === "income" ? "bg-success/10 text-success" : tone === "expense" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <Card className={wide ? "col-span-2 lg:col-span-1" : ""}>
      <CardContent className="px-4 sm:px-5">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 [&>svg]:size-4 ${iconClass}`}>{icon}</span>
        <div className="mt-3 min-w-0 sm:mt-4">
          <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-0.5 truncate font-heading text-base font-bold sm:text-xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`));
}
