import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { category } from "@/db/schema";
import { apiError, notFound, unauthorized } from "@/lib/api";
import { categorySchema } from "@/lib/finance/validation";
import { getRequestUser } from "@/lib/session";

const updateSchema = categorySchema.partial().refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const rows = await db.update(category).set(input).where(and(eq(category.id, id), eq(category.userId, user.id), eq(category.isSystem, false))).returning();
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
  const rows = await db.update(category).set({ isArchived: true }).where(and(eq(category.id, id), eq(category.userId, user.id), eq(category.isSystem, false))).returning();
  if (!rows[0]) return notFound();
  return Response.json(rows[0]);
}
