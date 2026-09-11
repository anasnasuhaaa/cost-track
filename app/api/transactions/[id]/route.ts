import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { financeTransaction } from "@/db/schema";
import { apiError, notFound, unauthorized } from "@/lib/api";
import { validateTransactionRelations } from "@/lib/finance/mutations";
import { transactionSchema } from "@/lib/finance/validation";
import { getRequestUser } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const { id } = await params;
    const input = transactionSchema.parse(await request.json());
    if (!(await validateTransactionRelations(user.id, input))) return Response.json({ error: "Akun atau kategori tidak valid." }, { status: 400 });
    const rows = await db.update(financeTransaction).set(input).where(and(eq(financeTransaction.id, id), eq(financeTransaction.userId, user.id))).returning();
    if (!rows[0]) return notFound();
    return Response.json(rows[0]);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const rows = await db.delete(financeTransaction).where(and(eq(financeTransaction.id, id), eq(financeTransaction.userId, user.id))).returning({ id: financeTransaction.id });
  if (!rows[0]) return notFound();
  return Response.json({ success: true });
}
