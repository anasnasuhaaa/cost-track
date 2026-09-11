import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { category } from "@/db/schema";
import { apiError, unauthorized } from "@/lib/api";
import { categorySchema } from "@/lib/finance/validation";
import { getRequestUser } from "@/lib/session";

export async function GET() {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const rows = await db.select().from(category).where(and(eq(category.isArchived, false), or(eq(category.isSystem, true), eq(category.userId, user.id)))).orderBy(category.type, category.name);
    return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const input = categorySchema.parse(await request.json());
    const rows = await db.insert(category).values({ ...input, userId: user.id }).returning();
    return Response.json(rows[0], { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
