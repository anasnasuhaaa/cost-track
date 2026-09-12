import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { category, categoryPreference } from "@/db/schema";
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
    const target = await db.select().from(category).where(and(eq(category.id, id), eq(category.isArchived, false))).limit(1);
    if (!target[0] || (!target[0].isSystem && target[0].userId !== user.id)) return notFound();

    if (target[0].isSystem) {
      if (!input.name || input.type) return Response.json({ error: "Kategori bawaan hanya dapat diubah namanya." }, { status: 400 });
      const rows = await db.insert(categoryPreference).values({ userId: user.id, categoryId: id, name: input.name }).onConflictDoUpdate({
        target: [categoryPreference.userId, categoryPreference.categoryId],
        set: { name: input.name },
      }).returning();
      return Response.json({ ...target[0], name: rows[0].name ?? target[0].name });
    }

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
  try {
    const { id } = await params;
    const target = await db.select().from(category).where(and(eq(category.id, id), eq(category.isArchived, false))).limit(1);
    if (!target[0] || (!target[0].isSystem && target[0].userId !== user.id)) return notFound();

    if (target[0].isSystem) {
      const rows = await db.insert(categoryPreference).values({ userId: user.id, categoryId: id, isArchived: true }).onConflictDoUpdate({
        target: [categoryPreference.userId, categoryPreference.categoryId],
        set: { isArchived: true },
      }).returning();
      return Response.json(rows[0]);
    }

    const rows = await db.update(category).set({ isArchived: true }).where(and(eq(category.id, id), eq(category.userId, user.id), eq(category.isSystem, false))).returning();
    if (!rows[0]) return notFound();
    return Response.json(rows[0]);
  } catch (error) {
    return apiError(error);
  }
}
