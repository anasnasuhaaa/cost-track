import "server-only";

import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { category, categoryPreference, financeAccount, financeTransaction } from "@/db/schema";
import { transactionFiltersSchema } from "./validation";

export async function listAccounts(userId: string, includeArchived = false) {
  return db
    .select({
      id: financeAccount.id,
      name: financeAccount.name,
      type: financeAccount.type,
      openingBalance: financeAccount.openingBalance,
      isDefault: financeAccount.isDefault,
      isArchived: financeAccount.isArchived,
      income: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'INCOME' then ${financeTransaction.amount} else 0 end), 0)::int`,
      expense: sql<number>`coalesce(sum(case when ${financeTransaction.type} = 'EXPENSE' then ${financeTransaction.amount} else 0 end), 0)::int`,
    })
    .from(financeAccount)
    .leftJoin(
      financeTransaction,
      and(eq(financeTransaction.accountId, financeAccount.id), eq(financeTransaction.userId, userId)),
    )
    .where(and(eq(financeAccount.userId, userId), includeArchived ? undefined : eq(financeAccount.isArchived, false)))
    .groupBy(financeAccount.id)
    .orderBy(desc(financeAccount.isDefault), financeAccount.name);
}

export async function listCategories(userId: string, includeArchived = false) {
  const displayName = sql<string>`coalesce(${categoryPreference.name}, ${category.name})`;
  const archived = sql<boolean>`coalesce(${categoryPreference.isArchived}, ${category.isArchived})`;

  return db
    .select({
      id: category.id,
      userId: category.userId,
      name: displayName,
      type: category.type,
      icon: category.icon,
      systemKey: category.systemKey,
      isSystem: category.isSystem,
      isArchived: archived,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })
    .from(category)
    .leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId)))
    .where(
      and(
        or(eq(category.isSystem, true), eq(category.userId, userId)),
        includeArchived ? undefined : eq(archived, false),
      ),
    )
    .orderBy(category.type, desc(category.isSystem), category.name);
}

export async function listTransactions(userId: string, rawFilters: Record<string, string | undefined>) {
  const filters = transactionFiltersSchema.parse(rawFilters);
  const conditions = [eq(financeTransaction.userId, userId)];
  if (filters.search) conditions.push(ilike(financeTransaction.description, `%${filters.search}%`));
  if (filters.type) conditions.push(eq(financeTransaction.type, filters.type));
  if (filters.categoryId) conditions.push(eq(financeTransaction.categoryId, filters.categoryId));
  if (filters.accountId) conditions.push(eq(financeTransaction.accountId, filters.accountId));
  if (filters.from) conditions.push(gte(financeTransaction.transactionDate, filters.from));
  if (filters.to) conditions.push(lte(financeTransaction.transactionDate, filters.to));
  const where = and(...conditions);
  const offset = (filters.page - 1) * filters.pageSize;
  const categoryName = sql<string>`coalesce(${categoryPreference.name}, ${category.name})`;

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: financeTransaction.id,
        type: financeTransaction.type,
        amount: financeTransaction.amount,
        description: financeTransaction.description,
        transactionDate: financeTransaction.transactionDate,
        source: financeTransaction.source,
        accountId: financeTransaction.accountId,
        accountName: financeAccount.name,
        categoryId: financeTransaction.categoryId,
        categoryName,
      })
      .from(financeTransaction)
      .innerJoin(financeAccount, eq(financeTransaction.accountId, financeAccount.id))
      .innerJoin(category, eq(financeTransaction.categoryId, category.id))
      .leftJoin(categoryPreference, and(eq(categoryPreference.categoryId, category.id), eq(categoryPreference.userId, userId)))
      .where(where)
      .orderBy(desc(financeTransaction.transactionDate), desc(financeTransaction.createdAt))
      .limit(filters.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(financeTransaction).where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return { items, total, page: filters.page, pageSize: filters.pageSize, pages: Math.max(1, Math.ceil(total / filters.pageSize)) };
}
