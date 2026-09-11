import { eq } from "drizzle-orm";

import { db } from "@/db";
import { financeAccount } from "@/db/schema";
import { apiError, unauthorized } from "@/lib/api";
import { listAccounts } from "@/lib/finance/queries";
import { accountSchema } from "@/lib/finance/validation";
import { getRequestUser } from "@/lib/session";

export async function GET() {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    return Response.json(await listAccounts(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const input = accountSchema.parse(await request.json());
    let created;

    if (input.isDefault) {
      const [, rows] = await db.batch([
        db.update(financeAccount).set({ isDefault: false }).where(eq(financeAccount.userId, user.id)),
        db.insert(financeAccount).values({ ...input, userId: user.id }).returning(),
      ]);
      created = rows[0];
    } else {
      const rows = await db.insert(financeAccount).values({ ...input, userId: user.id }).returning();
      created = rows[0];
    }

    return Response.json(created, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
