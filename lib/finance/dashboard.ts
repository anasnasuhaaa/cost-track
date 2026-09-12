import "server-only";

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { category, categoryPreference, financeAccount, financeTransaction } from "@/db/schema";
import { monthRange } from "./calculations";

export async function getDashboard(userId: string, requestedPeriod?: string) {
  const period = monthRange(requestedPeriod);
  const categoryName = sql<string>`coalesce(${categoryPreference.name}, ${category.name})`;
  const inPeriod = and(
    eq(financeTransaction.userId, userId),
    gte(financeTransaction.transactionDate, period.start),
    lte(financeTransaction.transactionDate, period.end),
  );

  const [openingRows, lifetimeRows, summaryRows, dailyRows, categoryRows, recentRows] = await Promise.all([
    db.select({ value: sql<number>`coalesce(sum(${financeAccount.openingBalance}), 0)::int` }).from(financeAccount).where(eq(financeAccount.userId, userId)),
    db.select({
      income: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'INCOME' then ${financeTransaction.amount} else 0 end), 0)::int`,
      expense: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'EXPENSE' then ${financeTransaction.amount} else 0 end), 0)::int`,
    }).from(financeTransaction).where(eq(financeTransaction.userId, userId)),
    db.select({
      income: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'INCOME' then ${financeTransaction.amount} else 0 end), 0)::int`,
      expense: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'EXPENSE' then ${financeTransaction.amount} else 0 end), 0)::int`,
      transactionCount: count(),
    }).from(financeTransaction).where(inPeriod),
    db.select({ date: financeTransaction.transactionDate, amount: sql<number>`sum(${financeTransaction.amount})::int` }).from(financeTransaction).where(and(inPeriod, eq(financeTransaction.type, "EXPENSE"))).groupBy(financeTransaction.transactionDate).orderBy(financeTransaction.transactionDate),
    db.select({ name: categoryName, amount: sql<number>`sum(${financeTransaction.amount})::int`, transactionCount: count() }).from(financeTransaction).innerJoin(category, eq(financeTransaction.categoryId, category.id)).leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId))).where(and(inPeriod, eq(financeTransaction.type, "EXPENSE"))).groupBy(category.id, category.name, categoryPreference.name).orderBy(desc(sql`sum(${financeTransaction.amount})`)).limit(8),
    db.select({ id: financeTransaction.id, type: financeTransaction.type, amount: financeTransaction.amount, description: financeTransaction.description, transactionDate: financeTransaction.transactionDate, accountName: financeAccount.name, categoryName }).from(financeTransaction).innerJoin(financeAccount, eq(financeTransaction.accountId, financeAccount.id)).innerJoin(category, eq(financeTransaction.categoryId, category.id)).leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId))).where(eq(financeTransaction.userId, userId)).orderBy(desc(financeTransaction.transactionDate), desc(financeTransaction.createdAt)).limit(6),
  ]);

  const opening = Number(openingRows[0]?.value ?? 0);
  const lifetimeIncome = Number(lifetimeRows[0]?.income ?? 0);
  const lifetimeExpense = Number(lifetimeRows[0]?.expense ?? 0);
  return {
    period: period.period,
    balance: opening + lifetimeIncome - lifetimeExpense,
    income: Number(summaryRows[0]?.income ?? 0),
    expense: Number(summaryRows[0]?.expense ?? 0),
    transactionCount: Number(summaryRows[0]?.transactionCount ?? 0),
    dailyExpenses: dailyRows.map((item) => ({ date: item.date, amount: Number(item.amount) })),
    categoryExpenses: categoryRows.map((item) => ({ name: item.name, amount: Number(item.amount), transactionCount: Number(item.transactionCount) })),
    recent: recentRows,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
