import { z } from "zod";

import { classifyQuestion } from "@/lib/ai/assistant";
import { apiError, unauthorized } from "@/lib/api";
import { answerFinancialQuestion } from "@/lib/finance/assistant";
import { listAccounts, listCategories } from "@/lib/finance/queries";
import { takeRateLimit } from "@/lib/rate-limit";
import { getRequestUser } from "@/lib/session";

const questionSchema = z.object({ question: z.string().trim().min(3).max(300) });

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  if (!takeRateLimit(`assistant:${user.id}`, 15)) return Response.json({ error: "Terlalu banyak pertanyaan. Coba lagi sebentar." }, { status: 429 });
  try {
    const { question } = questionSchema.parse(await request.json());
    const [accounts, categories] = await Promise.all([listAccounts(user.id), listCategories(user.id)]);
    const intent = await classifyQuestion(question, { accountNames: accounts.map((item) => item.name), categoryNames: categories.map((item) => item.name) });
    const normalize = (value: string) => value.toLocaleLowerCase("id-ID");
    const canonicalIntent = {
      ...intent,
      category: intent.category ? categories.find((item) => normalize(item.name) === normalize(intent.category!))?.name ?? null : null,
      account: intent.account ? accounts.find((item) => normalize(item.name) === normalize(intent.account!))?.name ?? null : null,
    };
    return Response.json(await answerFinancialQuestion(user.id, canonicalIntent), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
