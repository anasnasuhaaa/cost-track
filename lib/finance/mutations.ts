import "server-only";

import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { category, financeAccount } from "@/db/schema";
import type { TransactionInput } from "./validation";

export async function validateTransactionRelations(userId: string, input: TransactionInput) {
  const [accountRows, categoryRows] = await Promise.all([
    db
      .select({ id: financeAccount.id })
      .from(financeAccount)
      .where(and(eq(financeAccount.id, input.accountId), eq(financeAccount.userId, userId), eq(financeAccount.isArchived, false)))
      .limit(1),
    db
      .select({ id: category.id, type: category.type })
      .from(category)
      .where(
        and(
          eq(category.id, input.categoryId),
          eq(category.isArchived, false),
          or(eq(category.isSystem, true), eq(category.userId, userId)),
        ),
      )
      .limit(1),
  ]);

  if (!accountRows[0] || !categoryRows[0] || categoryRows[0].type !== input.type) return false;
  return true;
}
