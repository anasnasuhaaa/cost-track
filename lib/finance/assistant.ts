import "server-only";

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { category, financeTransaction } from "@/db/schema";
import type { AssistantIntent } from "@/lib/ai/assistant";
import { formatRupiah, jakartaToday, monthRange, previousMonth } from "./calculations";
import { listAccounts } from "./queries";

type AssistantAnswer = { answer: string; metric?: string; details?: string[]; suggestions: string[] };

function rangeFor(period: AssistantIntent["period"]) {
  const current = monthRange();
  if (period === "PREVIOUS_MONTH") return monthRange(previousMonth(current.period));
  if (period === "CURRENT_WEEK") {
    const today = jakartaToday();
    const date = new Date(`${today}T12:00:00+07:00`);
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    return { period: "minggu ini", start: jakartaToday(date), end: today };
  }
  return current;
}

function periodLabel(period: AssistantIntent["period"]) { return period === "CURRENT_WEEK" ? "minggu ini" : period === "PREVIOUS_MONTH" ? "bulan lalu" : "bulan ini"; }

export async function answerFinancialQuestion(userId: string, intent: AssistantIntent): Promise<AssistantAnswer> {
  const suggestions = ["Pengeluaran bulan ini", "Kategori terbesar", "Bandingkan dengan bulan lalu"];
  const range = rangeFor(intent.period);
  const base = and(eq(financeTransaction.userId, userId), gte(financeTransaction.transactionDate, range.start), lte(financeTransaction.transactionDate, range.end));

  if (intent.intent === "ACCOUNT_BALANCE") {
    const accounts = await listAccounts(userId);
    const chosen = intent.account ? accounts.find((item) => item.name.toLocaleLowerCase("id-ID") === intent.account!.toLocaleLowerCase("id-ID")) : null;
    const balance = (item: (typeof accounts)[number]) => Number(item.openingBalance) + Number(item.income) - Number(item.expense);
    if (intent.account && !chosen) return { answer: "Akun tersebut tidak ditemukan.", suggestions };
    const total = chosen ? balance(chosen) : accounts.reduce((sum, item) => sum + balance(item), 0);
    return { answer: chosen ? `Saldo ${chosen.name} saat ini adalah:` : "Total saldo seluruh akun saat ini adalah:", metric: formatRupiah(total), details: chosen ? undefined : accounts.slice(0, 5).map((item) => `${item.name}: ${formatRupiah(balance(item))}`), suggestions };
  }

  if (intent.intent === "RECENT_TRANSACTIONS") {
    const rows = await db.select({ description: financeTransaction.description, type: financeTransaction.type, amount: financeTransaction.amount, date: financeTransaction.transactionDate }).from(financeTransaction).where(eq(financeTransaction.userId, userId)).orderBy(desc(financeTransaction.transactionDate), desc(financeTransaction.createdAt)).limit(5);
    return { answer: rows.length ? "Berikut transaksi terbarumu:" : "Belum ada transaksi yang dapat ditampilkan.", details: rows.map((item) => `${item.description} · ${item.type === "INCOME" ? "+" : "−"}${formatRupiah(item.amount)} · ${item.date}`), suggestions };
  }

  if (intent.intent === "PERIOD_COMPARISON") {
    const current = monthRange(); const previous = monthRange(previousMonth(current.period));
    const rows = await db.select({ period: sql<string>`case when ${financeTransaction.transactionDate} >= ${current.start} then 'current' else 'previous' end`, amount: sql<number>`sum(${financeTransaction.amount})::int` }).from(financeTransaction).where(and(eq(financeTransaction.userId, userId), eq(financeTransaction.type, "EXPENSE"), gte(financeTransaction.transactionDate, previous.start), lte(financeTransaction.transactionDate, current.end))).groupBy(sql`case when ${financeTransaction.transactionDate} >= ${current.start} then 'current' else 'previous' end`);
    const currentAmount = Number(rows.find((item) => item.period === "current")?.amount ?? 0); const previousAmount = Number(rows.find((item) => item.period === "previous")?.amount ?? 0); const difference = currentAmount - previousAmount;
    return { answer: difference === 0 ? "Pengeluaran bulan ini sama dengan bulan lalu." : `Pengeluaran bulan ini ${difference > 0 ? "lebih tinggi" : "lebih rendah"} ${formatRupiah(Math.abs(difference))} dari bulan lalu.`, metric: formatRupiah(currentAmount), details: [`Bulan lalu: ${formatRupiah(previousAmount)}`], suggestions };
  }

  if (intent.intent === "TOP_CATEGORIES") {
    const rows = await db.select({ name: category.name, amount: sql<number>`sum(${financeTransaction.amount})::int`, transactionCount: count() }).from(financeTransaction).innerJoin(category, eq(financeTransaction.categoryId, category.id)).where(and(base, eq(financeTransaction.type, "EXPENSE"))).groupBy(category.id, category.name).orderBy(desc(sql`sum(${financeTransaction.amount})`)).limit(3);
    const top = rows[0]; const total = rows.reduce((sum, item) => sum + Number(item.amount), 0);
    if (!top) return { answer: `Belum ada pengeluaran ${periodLabel(intent.period)}.`, suggestions };
    return { answer: `${top.name} adalah kategori pengeluaran terbesar ${periodLabel(intent.period)}.`, metric: formatRupiah(Number(top.amount)), details: [`${top.transactionCount} transaksi`, total ? `${Math.round((Number(top.amount) / total) * 100)}% dari kategori teratas` : ""].filter(Boolean), suggestions };
  }

  if (intent.intent === "CATEGORY_SPENDING") {
    if (!intent.category) return { answer: "Sebutkan kategori pengeluaran yang ingin diperiksa.", suggestions };
    const rows = await db.select({ amount: sql<number>`coalesce(sum(${financeTransaction.amount}), 0)::int`, transactionCount: count() }).from(financeTransaction).innerJoin(category, eq(financeTransaction.categoryId, category.id)).where(and(base, eq(financeTransaction.type, "EXPENSE"), eq(category.name, intent.category)));
    return { answer: `Pengeluaran ${intent.category} ${periodLabel(intent.period)}:`, metric: formatRupiah(Number(rows[0]?.amount ?? 0)), details: [`${rows[0]?.transactionCount ?? 0} transaksi`], suggestions };
  }

  if (["INCOME_TOTAL", "EXPENSE_TOTAL", "CURRENT_MONTH_SUMMARY"].includes(intent.intent)) {
    const rows = await db.select({ income: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'INCOME' then ${financeTransaction.amount} else 0 end), 0)::int`, expense: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'EXPENSE' then ${financeTransaction.amount} else 0 end), 0)::int`, transactionCount: count() }).from(financeTransaction).where(base);
    const result = rows[0];
    if (intent.intent === "INCOME_TOTAL") return { answer: `Total pemasukan ${periodLabel(intent.period)}:`, metric: formatRupiah(Number(result?.income ?? 0)), details: [`${result?.transactionCount ?? 0} total transaksi pada periode ini`], suggestions };
    if (intent.intent === "EXPENSE_TOTAL") return { answer: `Total pengeluaran ${periodLabel(intent.period)}:`, metric: formatRupiah(Number(result?.expense ?? 0)), details: [`${result?.transactionCount ?? 0} total transaksi pada periode ini`], suggestions };
    return { answer: `Ringkasan keuangan ${periodLabel(intent.period)}:`, metric: formatRupiah(Number(result?.income ?? 0) - Number(result?.expense ?? 0)), details: [`Pemasukan: ${formatRupiah(Number(result?.income ?? 0))}`, `Pengeluaran: ${formatRupiah(Number(result?.expense ?? 0))}`, `${result?.transactionCount ?? 0} transaksi`], suggestions };
  }

  return { answer: "Pertanyaan itu belum didukung. Aku bisa membantu ringkasan, pemasukan, pengeluaran, kategori terbesar, saldo, perbandingan periode, dan transaksi terbaru.", suggestions };
}
