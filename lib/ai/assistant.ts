import "server-only";

import { z } from "zod";

import { GeminiUnavailableError, requestStructured } from "./gemini";

export const assistantIntentSchema = z.object({
  intent: z.enum(["CURRENT_MONTH_SUMMARY", "CATEGORY_SPENDING", "INCOME_TOTAL", "EXPENSE_TOTAL", "TOP_CATEGORIES", "PERIOD_COMPARISON", "ACCOUNT_BALANCE", "RECENT_TRANSACTIONS", "UNSUPPORTED"]),
  period: z.enum(["TODAY", "YESTERDAY", "LAST_3_DAYS", "LAST_7_DAYS", "CURRENT_WEEK", "CURRENT_MONTH", "PREVIOUS_MONTH"]).default("CURRENT_MONTH"),
  category: z.string().max(60).nullable().default(null),
  account: z.string().max(60).nullable().default(null),
});

export type AssistantIntent = z.infer<typeof assistantIntentSchema>;

const intentJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string", enum: ["CURRENT_MONTH_SUMMARY", "CATEGORY_SPENDING", "INCOME_TOTAL", "EXPENSE_TOTAL", "TOP_CATEGORIES", "PERIOD_COMPARISON", "ACCOUNT_BALANCE", "RECENT_TRANSACTIONS", "UNSUPPORTED"] },
    period: { type: "string", enum: ["TODAY", "YESTERDAY", "LAST_3_DAYS", "LAST_7_DAYS", "CURRENT_WEEK", "CURRENT_MONTH", "PREVIOUS_MONTH"] },
    category: { type: ["string", "null"] },
    account: { type: ["string", "null"] },
  },
  required: ["intent", "period", "category", "account"],
};

export async function classifyQuestion(question: string, context: { categoryNames: string[]; accountNames: string[] }) {
  try {
    const raw = await requestStructured<unknown>({
      input: `Pertanyaan: ${question}\nKategori valid: ${context.categoryNames.join(", ")}\nAkun valid: ${context.accountNames.join(", ")}`,
      systemInstruction: "Klasifikasikan pertanyaan finansial berbahasa Indonesia ke satu intent whitelist. Pemetaan periode: hari ini=TODAY, kemarin=YESTERDAY, 3 hari terakhir/ke belakang=LAST_3_DAYS, 7 hari terakhir/seminggu terakhir=LAST_7_DAYS, minggu ini=CURRENT_WEEK, bulan ini=CURRENT_MONTH, bulan lalu=PREVIOUS_MONTH. Jangan menghitung, menjawab, membuat SQL, atau mengarang kategori/akun. Gunakan UNSUPPORTED untuk permintaan di luar ringkasan, pemasukan, pengeluaran, kategori, saldo, perbandingan periode, dan transaksi terbaru.",
      schema: intentJsonSchema,
    });
    return assistantIntentSchema.parse(raw);
  } catch (error) {
    if (!(error instanceof GeminiUnavailableError || error instanceof z.ZodError)) throw error;
    return classifyLocally(question, context);
  }
}

export function classifyLocally(question: string, context: { categoryNames: string[]; accountNames: string[] }): AssistantIntent {
  const normalized = question.toLocaleLowerCase("id-ID");
  const period: AssistantIntent["period"] = /(?:3|tiga)\s*hari(?:\s+(?:terakhir|ke belakang|belakangan))?/.test(normalized)
    ? "LAST_3_DAYS"
    : /(?:7|tujuh)\s*hari|(?:se|satu)\s*minggu\s+terakhir|sepekan\s+terakhir/.test(normalized)
      ? "LAST_7_DAYS"
      : /kemarin/.test(normalized)
        ? "YESTERDAY"
        : /hari\s+ini/.test(normalized)
          ? "TODAY"
          : /(?:minggu|pekan)\s+ini/.test(normalized)
            ? "CURRENT_WEEK"
            : /bulan\s+lalu/.test(normalized)
              ? "PREVIOUS_MONTH"
              : "CURRENT_MONTH";
  const category = context.categoryNames.find((name) => normalized.includes(name.toLocaleLowerCase("id-ID"))) ?? null;
  const account = context.accountNames.find((name) => normalized.includes(name.toLocaleLowerCase("id-ID"))) ?? null;
  let intent: AssistantIntent["intent"] = "UNSUPPORTED";
  if (/banding|dibanding|perbandingan/.test(normalized)) intent = "PERIOD_COMPARISON";
  else if (/paling boros|kategori.*besar|terbesar.*kategori|paling banyak.*(?:habis|keluar|belanja)|(?:habis|keluar).*paling banyak/.test(normalized)) intent = "TOP_CATEGORIES";
  else if (/saldo|balance|sisa\s+uang|uang.*(?:tersisa|tersedia)/.test(normalized)) intent = "ACCOUNT_BALANCE";
  else if (/transaksi.*(?:terbaru|terakhir)|(?:terbaru|terakhir).*transaksi|riwayat\s+transaksi|\brecent\b/.test(normalized)) intent = "RECENT_TRANSACTIONS";
  else if (/pengeluaran|keluar|habis/.test(normalized) && category) intent = "CATEGORY_SPENDING";
  else if (/pemasukan|pendapatan|uang\s+masuk/.test(normalized)) intent = "INCOME_TOTAL";
  else if (/pengeluaran|uang\s+keluar|habis|belanja/.test(normalized)) intent = "EXPENSE_TOTAL";
  else if (/ringkas|ringkasan|kondisi keuangan|keuangan.*(?:bagaimana|gimana)|(?:bagaimana|gimana).*keuangan/.test(normalized)) intent = "CURRENT_MONTH_SUMMARY";
  return { intent, period, category, account };
}
