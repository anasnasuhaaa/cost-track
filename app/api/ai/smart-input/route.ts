import { z } from "zod";

import { GeminiUnavailableError } from "@/lib/ai/gemini";
import { extractTransaction } from "@/lib/ai/smart-input";
import { apiError, unauthorized } from "@/lib/api";
import { listAccounts, listCategories } from "@/lib/finance/queries";
import { jakartaToday } from "@/lib/finance/calculations";
import { takeRateLimit } from "@/lib/rate-limit";
import { getRequestUser } from "@/lib/session";

const inputSchema = z.object({ text: z.string().trim().min(2).max(300) });

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();
  if (!takeRateLimit(`smart-input:${user.id}`)) return Response.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
  try {
    const { text } = inputSchema.parse(await request.json());
    const [accounts, categories] = await Promise.all([listAccounts(user.id), listCategories(user.id)]);
    const extracted = await extractTransaction(text, { accountNames: accounts.map((item) => item.name), categoryNames: categories.map((item) => item.name) });
    if (!extracted.type || !extracted.amount || !extracted.description) return Response.json({ error: "AI belum menemukan detail transaksi yang cukup. Tambahkan nominal dan konteks transaksi." }, { status: 422 });
    const normalize = (value: string) => value.trim().toLocaleLowerCase("id-ID");
    const account = extracted.account ? accounts.find((item) => normalize(item.name) === normalize(extracted.account!)) : accounts.find((item) => item.isDefault) ?? accounts[0];
    const category = categories.find((item) => item.type === extracted.type && extracted.category && normalize(item.name) === normalize(extracted.category)) ?? categories.find((item) => item.type === extracted.type && ["lainnya", "pemasukan lainnya"].includes(normalize(item.name)));
    if (!account || !category) return Response.json({ error: "Akun atau kategori yang sesuai belum tersedia. Gunakan input manual." }, { status: 422 });
    return Response.json({ type: extracted.type, amount: extracted.amount, description: extracted.description, accountId: account.id, categoryId: category.id, transactionDate: extracted.transactionDate ?? jakartaToday(), source: "AI" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof GeminiUnavailableError || error instanceof z.ZodError) return Response.json({ error: "AI sedang tidak tersedia. Kamu masih bisa mencatat transaksi secara manual." }, { status: 503 });
    return apiError(error);
  }
}
