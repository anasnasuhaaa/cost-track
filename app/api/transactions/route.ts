import { db } from "@/db";
import { financeTransaction } from "@/db/schema";
import { apiError, unauthorized } from "@/lib/api";
import { validateTransactionRelations } from "@/lib/finance/mutations";
import { listTransactions } from "@/lib/finance/queries";
import { transactionSchema } from "@/lib/finance/validation";
import { getRequestUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    return Response.json(await listTransactions(user.id, query), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const input = transactionSchema.parse(await request.json());
    if (!(await validateTransactionRelations(user.id, input))) return Response.json({ error: "Akun atau kategori tidak valid." }, { status: 400 });
    const rows = await db.insert(financeTransaction).values({ ...input, userId: user.id }).returning();
    return Response.json(rows[0], { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
