import "server-only";

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { category, categoryPreference, financeAccount, financeTransaction } from "@/db/schema";
import type { AssistantIntent } from "@/lib/ai/assistant";
import { formatRupiah, jakartaToday, monthRange, previousMonth } from "./calculations";
import { listAccounts } from "./queries";

type AssistantAnswer = { answer: string; metric?: string; details?: string[]; suggestions: string[] };

function rangeFor(period: AssistantIntent["period"]) {
  const current = monthRange();
  const today = jakartaToday();
  if (period === "TODAY") return { period: "hari ini", start: today, end: today };
  if (period === "YESTERDAY") {
    const yesterday = shiftDate(today, -1);
    return { period: "kemarin", start: yesterday, end: yesterday };
  }
  if (period === "LAST_3_DAYS") return { period: "3 hari terakhir", start: shiftDate(today, -2), end: today };
  if (period === "LAST_7_DAYS") return { period: "7 hari terakhir", start: shiftDate(today, -6), end: today };
  if (period === "PREVIOUS_MONTH") return monthRange(previousMonth(current.period));
  if (period === "CURRENT_WEEK") {
    const date = new Date(`${today}T12:00:00+07:00`);
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    return { period: "minggu ini", start: jakartaToday(date), end: today };
  }
  return current;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return jakartaToday(date);
}

function periodLabel(period: AssistantIntent["period"]) {
  if (period === "TODAY") return "hari ini";
  if (period === "YESTERDAY") return "kemarin";
  if (period === "LAST_3_DAYS") return "selama 3 hari terakhir";
  if (period === "LAST_7_DAYS") return "selama 7 hari terakhir";
  if (period === "CURRENT_WEEK") return "minggu ini";
  return period === "PREVIOUS_MONTH" ? "bulan lalu" : "bulan ini";
}

export async function answerFinancialQuestion(userId: string, intent: AssistantIntent): Promise<AssistantAnswer> {
  const suggestions = ["Pengeluaran hari ini", "Pengeluaran 3 hari terakhir", "Kategori terbesar bulan ini"];
  const range = rangeFor(intent.period);
  const base = and(eq(financeTransaction.userId, userId), gte(financeTransaction.transactionDate, range.start), lte(financeTransaction.transactionDate, range.end));
  const categoryName = sql<string>`coalesce(${categoryPreference.name}, ${category.name})`;

  if (intent.intent === "ACCOUNT_BALANCE") {
    const accounts = await listAccounts(userId);
    const chosen = intent.account ? accounts.find((item) => item.name.toLocaleLowerCase("id-ID") === intent.account!.toLocaleLowerCase("id-ID")) : null;
    const balance = (item: (typeof accounts)[number]) => Number(item.openingBalance) + Number(item.income) - Number(item.expense);
    if (intent.account && !chosen) return { answer: "Akun tersebut tidak ditemukan.", suggestions };
    const total = chosen ? balance(chosen) : accounts.reduce((sum, item) => sum + balance(item), 0);
    return { answer: chosen ? `Saldo ${chosen.name} saat ini adalah:` : "Total saldo seluruh akun saat ini adalah:", metric: formatRupiah(total), details: chosen ? undefined : accounts.slice(0, 5).map((item) => `${item.name}: ${formatRupiah(balance(item))}`), suggestions };
  }

  if (intent.intent === "RECENT_TRANSACTIONS") {
    const rows = await db.select({ description: financeTransaction.description, type: financeTransaction.type, amount: financeTransaction.amount, categoryName }).from(financeTransaction).innerJoin(category, eq(financeTransaction.categoryId, category.id)).leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId))).where(eq(financeTransaction.userId, userId)).orderBy(desc(financeTransaction.transactionDate), desc(financeTransaction.createdAt)).limit(5);
    return { answer: rows.length ? "Transaksi terbarumu:" : "Belum ada transaksi yang dapat ditampilkan.", details: rows.map((item) => `${item.description} · ${item.categoryName} · ${item.type === "INCOME" ? "+" : "−"}${formatRupiah(item.amount)}`), suggestions };
  }

  if (intent.intent === "PERIOD_COMPARISON") {
    const current = monthRange(); const previous = monthRange(previousMonth(current.period));
    const rows = await db.select({ period: sql<string>`case when ${financeTransaction.transactionDate} >= ${current.start} then 'current' else 'previous' end`, amount: sql<number>`sum(${financeTransaction.amount})::int` }).from(financeTransaction).where(and(eq(financeTransaction.userId, userId), eq(financeTransaction.type, "EXPENSE"), gte(financeTransaction.transactionDate, previous.start), lte(financeTransaction.transactionDate, current.end))).groupBy(sql`case when ${financeTransaction.transactionDate} >= ${current.start} then 'current' else 'previous' end`);
    const currentAmount = Number(rows.find((item) => item.period === "current")?.amount ?? 0); const previousAmount = Number(rows.find((item) => item.period === "previous")?.amount ?? 0); const difference = currentAmount - previousAmount;
    return { answer: difference === 0 ? "Pengeluaran bulan ini sama dengan bulan lalu." : `Pengeluaran bulan ini ${difference > 0 ? "lebih tinggi" : "lebih rendah"} ${formatRupiah(Math.abs(difference))} dari bulan lalu.`, metric: formatRupiah(currentAmount), details: [`Bulan lalu: ${formatRupiah(previousAmount)}`], suggestions };
  }

  if (intent.intent === "TOP_CATEGORIES") {
    const [rows, totalRows] = await Promise.all([
      db.select({ name: categoryName, amount: sql<number>`sum(${financeTransaction.amount})::int`, transactionCount: count() }).from(financeTransaction).innerJoin(category, eq(financeTransaction.categoryId, category.id)).leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId))).where(and(base, eq(financeTransaction.type, "EXPENSE"))).groupBy(category.id, category.name, categoryPreference.name).orderBy(desc(sql`sum(${financeTransaction.amount})`)).limit(3),
      db.select({ amount: sql<number>`coalesce(sum(${financeTransaction.amount}), 0)::int` }).from(financeTransaction).where(and(base, eq(financeTransaction.type, "EXPENSE"))),
    ]);
    const top = rows[0]; const total = Number(totalRows[0]?.amount ?? 0);
    if (!top) return { answer: `Belum ada pengeluaran ${periodLabel(intent.period)}.`, suggestions };
    return { answer: `${top.name} adalah kategori pengeluaran terbesar ${periodLabel(intent.period)}.`, metric: formatRupiah(Number(top.amount)), details: rows.map((item) => `${item.name} · ${formatRupiah(Number(item.amount))} · ${item.transactionCount} transaksi${total ? ` (${Math.round((Number(item.amount) / total) * 100)}%)` : ""}`), suggestions };
  }

  if (intent.intent === "CATEGORY_SPENDING") {
    if (!intent.category) return { answer: "Sebutkan kategori pengeluaran yang ingin diperiksa.", suggestions };
    const categoryBase = and(base, eq(financeTransaction.type, "EXPENSE"), eq(categoryName, intent.category));
    const [rows, details] = await Promise.all([
      db.select({ amount: sql<number>`coalesce(sum(${financeTransaction.amount}), 0)::int`, transactionCount: count() }).from(financeTransaction).innerJoin(category, eq(financeTransaction.categoryId, category.id)).leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId))).where(categoryBase),
      expenseDetails(userId, categoryBase),
    ]);
    const transactionCount = rows[0]?.transactionCount ?? 0;
    return { answer: transactionCount ? `${transactionCount} pengeluaran ${intent.category} ${periodLabel(intent.period)}:` : `Belum ada pengeluaran ${intent.category} ${periodLabel(intent.period)}.`, metric: formatRupiah(Number(rows[0]?.amount ?? 0)), details, suggestions };
  }

  if (["INCOME_TOTAL", "EXPENSE_TOTAL", "CURRENT_MONTH_SUMMARY"].includes(intent.intent)) {
    const [rows, expenseItems] = await Promise.all([
      db.select({ income: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'INCOME' then ${financeTransaction.amount} else 0 end), 0)::int`, expense: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'EXPENSE' then ${financeTransaction.amount} else 0 end), 0)::int`, incomeCount: sql<number>`count(*) filter (where ${financeTransaction.type} = 'INCOME')::int`, expenseCount: sql<number>`count(*) filter (where ${financeTransaction.type} = 'EXPENSE')::int`, transactionCount: count() }).from(financeTransaction).where(base),
      intent.intent === "EXPENSE_TOTAL" ? expenseDetails(userId, and(base, eq(financeTransaction.type, "EXPENSE"))) : Promise.resolve([]),
    ]);
    const result = rows[0];
    if (intent.intent === "INCOME_TOTAL") return { answer: `${result?.incomeCount ?? 0} pemasukan ${periodLabel(intent.period)}:`, metric: formatRupiah(Number(result?.income ?? 0)), suggestions };
    if (intent.intent === "EXPENSE_TOTAL") return { answer: result?.expenseCount ? `${result.expenseCount} pengeluaran ${periodLabel(intent.period)}:` : `Belum ada pengeluaran ${periodLabel(intent.period)}.`, metric: formatRupiah(Number(result?.expense ?? 0)), details: expenseItems, suggestions };
    return { answer: `Ringkasan keuangan ${periodLabel(intent.period)}:`, metric: formatRupiah(Number(result?.income ?? 0) - Number(result?.expense ?? 0)), details: [`Pemasukan: ${formatRupiah(Number(result?.income ?? 0))}`, `Pengeluaran: ${formatRupiah(Number(result?.expense ?? 0))}`, `${result?.transactionCount ?? 0} transaksi`], suggestions };
  }

  return { answer: "Pertanyaan itu belum didukung. Aku bisa membantu ringkasan, pemasukan, pengeluaran, kategori terbesar, saldo, perbandingan periode, dan transaksi terbaru.", suggestions };
}

async function expenseDetails(userId: string, where: ReturnType<typeof and>) {
  const categoryName = sql<string>`coalesce(${categoryPreference.name}, ${category.name})`;
  const rows = await db
    .select({
      description: financeTransaction.description,
      amount: financeTransaction.amount,
      categoryName,
      accountName: financeAccount.name,
    })
    .from(financeTransaction)
    .innerJoin(category, eq(financeTransaction.categoryId, category.id))
    .innerJoin(financeAccount, eq(financeTransaction.accountId, financeAccount.id))
    .leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId)))
    .where(where)
    .orderBy(desc(financeTransaction.transactionDate), desc(financeTransaction.createdAt))
    .limit(5);

  return rows.map((item) => `${item.description} · ${item.categoryName} · ${formatRupiah(item.amount)} (${item.accountName})`);
}
