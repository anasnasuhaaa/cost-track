import { and, count, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { financeAccount, financeTransaction } from "@/db/schema";
import { apiError, notFound, unauthorized } from "@/lib/api";
import { accountSchema } from "@/lib/finance/validation";
import { getRequestUser } from "@/lib/session";

const updateSchema = accountSchema.partial().refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const existing = await db.select().from(financeAccount).where(and(eq(financeAccount.id, id), eq(financeAccount.userId, user.id))).limit(1);
    if (!existing[0]) return notFound();

    if (input.openingBalance !== undefined && input.openingBalance !== existing[0].openingBalance) {
      const used = await db.select({ value: count() }).from(financeTransaction).where(and(eq(financeTransaction.userId, user.id), eq(financeTransaction.accountId, id)));
      if ((used[0]?.value ?? 0) > 0) return Response.json({ error: "Saldo awal tidak dapat diubah setelah akun memiliki transaksi." }, { status: 409 });
    }
    if (input.isDefault === false && existing[0].isDefault) return Response.json({ error: "Pilih akun default lain terlebih dahulu." }, { status: 409 });
    if (input.isDefault) await db.update(financeAccount).set({ isDefault: false }).where(and(eq(financeAccount.userId, user.id), ne(financeAccount.id, id)));

    const rows = await db.update(financeAccount).set(input).where(and(eq(financeAccount.id, id), eq(financeAccount.userId, user.id))).returning();
    return Response.json(rows[0]);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await db.select().from(financeAccount).where(and(eq(financeAccount.id, id), eq(financeAccount.userId, user.id))).limit(1);
  if (!existing[0]) return notFound();
  if (existing[0].isDefault) return Response.json({ error: "Akun default tidak dapat diarsipkan." }, { status: 409 });
  const rows = await db.update(financeAccount).set({ isArchived: true }).where(and(eq(financeAccount.id, id), eq(financeAccount.userId, user.id))).returning();
  return Response.json(rows[0]);
}
