import { db } from "@/db";
import { category } from "@/db/schema";
import { apiError, unauthorized } from "@/lib/api";
import { listCategories } from "@/lib/finance/queries";
import { categorySchema } from "@/lib/finance/validation";
import { getRequestUser } from "@/lib/session";

export async function GET() {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  try {
    return Response.json(await listCategories(user.id), { headers: { "Cache-Control": "no-store" } });
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
