"use client";

import type { TooltipContentProps } from "recharts";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartNoAxesColumnIncreasing } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/finance/calculations";

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function DashboardCharts({ daily, categories }: { daily: { date: string; amount: number }[]; categories: { name: string; amount: number }[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <ChartCard title="Pengeluaran harian">
        {daily.length ? (
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 12, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(-2)} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" minTickGap={14} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} fontSize={11} width={54} stroke="var(--muted-foreground)" />
                <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.55 }} content={DailyTooltip} />
                <Bar dataKey="amount" fill="var(--chart-1)" radius={[6, 6, 2, 2]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <ChartEmpty />}
      </ChartCard>

      <ChartCard title="Kategori terbesar">
        {categories.length ? (
          <div className="grid items-center gap-4 sm:grid-cols-[190px_1fr] xl:grid-cols-1">
            <div className="mx-auto h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories.slice(0, 5)} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={3} stroke="none">
                    {categories.slice(0, 5).map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip content={CategoryTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {categories.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2.5 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                  <strong className="text-xs font-semibold">{compact(item.amount)}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : <ChartEmpty />}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}

function TooltipShell({ label, value }: { label: string; value: number }) {
  return <div className="min-w-36 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{formatRupiah(value)}</p></div>;
}

function DailyTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return <TooltipShell label={formatDate(String(label))} value={Number(payload[0].value)} />;
}

function CategoryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return <TooltipShell label={String(payload[0].name)} value={Number(payload[0].value)} />;
}

function ChartEmpty() {
  return <div className="grid h-56 place-items-center rounded-xl border border-dashed text-center text-sm text-muted-foreground"><div><ChartNoAxesColumnIncreasing className="mx-auto mb-3 size-6" /><p>Belum ada pengeluaran<br />untuk divisualisasikan.</p></div></div>;
}

function compact(value: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`));
}
