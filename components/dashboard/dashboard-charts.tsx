"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatRupiah } from "@/lib/finance/calculations";

const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];

export function DashboardCharts({ daily, categories }: { daily: { date: string; amount: number }[]; categories: { name: string; amount: number }[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <ChartCard title="Pengeluaran harian" description="Ritme pengeluaran selama periode ini">
        {daily.length ? <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="currentColor" opacity={0.08} /><XAxis dataKey="date" tickFormatter={(value: string) => value.slice(-2)} tickLine={false} axisLine={false} fontSize={12} /><YAxis tickFormatter={compact} tickLine={false} axisLine={false} fontSize={11} width={52} /><Tooltip cursor={{ fill: "currentColor", opacity: 0.04 }} formatter={(value) => [formatRupiah(Number(value)), "Pengeluaran"]} labelFormatter={(value) => formatDate(String(value))} contentStyle={{ borderRadius: 12, borderColor: "var(--border)", background: "var(--card)", color: "var(--card-foreground)" }} /><Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={30} /></BarChart></ResponsiveContainer></div> : <ChartEmpty />}
      </ChartCard>
      <ChartCard title="Kategori terbesar" description="Distribusi pengeluaranmu">
        {categories.length ? <div className="grid items-center sm:grid-cols-[180px_1fr] xl:grid-cols-1"><div className="mx-auto h-44 w-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={75} paddingAngle={3} stroke="none">{categories.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "var(--border)", background: "var(--card)", color: "var(--card-foreground)" }} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{categories.slice(0, 5).map((item, index) => <div key={item.name} className="flex items-center gap-2 text-sm"><span className="size-2.5 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span><strong className="text-xs">{compact(item.amount)}</strong></div>)}</div></div> : <ChartEmpty />}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="rounded-2xl border bg-card p-5"><div className="mb-4"><h2 className="font-heading text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>{children}</section>; }
function ChartEmpty() { return <div className="grid h-56 place-items-center rounded-xl border border-dashed text-center text-sm text-muted-foreground"><p>Belum ada pengeluaran<br />untuk divisualisasikan.</p></div>; }
function compact(value: number) { return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`)); }
