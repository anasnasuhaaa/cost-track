import "server-only";

import { z } from "zod";

import { jakartaToday } from "@/lib/finance/calculations";
import { requestStructured } from "./gemini";

const extractedTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).nullable(),
  amount: z.number().int().positive().max(2_000_000_000).nullable(),
  description: z.string().trim().min(1).max(160).nullable(),
  category: z.string().trim().min(1).max(60).nullable(),
  account: z.string().trim().min(1).max(60).nullable(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const extractedTransactionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: ["string", "null"], enum: ["INCOME", "EXPENSE", null], description: "Jenis transaksi; null jika tidak yakin." },
    amount: { type: ["integer", "null"], minimum: 1, maximum: 2_000_000_000, description: "Nominal rupiah penuh; jangan mengarang." },
    description: { type: ["string", "null"], description: "Deskripsi singkat transaksi." },
    category: { type: ["string", "null"], description: "Nama kategori dari daftar yang diberikan." },
    account: { type: ["string", "null"], description: "Nama akun hanya bila disebutkan user." },
    transactionDate: { type: ["string", "null"], format: "date", description: "Tanggal YYYY-MM-DD." },
  },
  required: ["type", "amount", "description", "category", "account", "transactionDate"],
};

export async function extractTransaction(text: string, context: { accountNames: string[]; categoryNames: string[]; fetcher?: typeof fetch }) {
  const today = jakartaToday();
  const raw = await requestStructured<unknown>({
    fetcher: context.fetcher,
    schema: extractedTransactionJsonSchema,
    input: `Teks transaksi: ${text}\nAkun tersedia: ${context.accountNames.join(", ")}\nKategori tersedia: ${context.categoryNames.join(", ")}\nTanggal hari ini di Asia/Jakarta: ${today}`,
    systemInstruction: [
      "Kamu hanya mengekstrak satu transaksi keuangan berbahasa Indonesia ke JSON.",
      "Pahami k/rb/ribu dan jt/juta, termasuk 1,5jt = 1500000.",
      "Jangan pernah mengarang nominal atau akun. Akun harus berasal dari daftar, atau null.",
      "Pilih kategori hanya dari daftar jika masuk akal. Gunakan null bila informasi kritis tidak yakin.",
      "Gunakan tanggal hari ini jika user tidak menyebut tanggal. Pahami kemarin dan tadi.",
      "Default EXPENSE hanya ketika konteks jelas berupa pembelian atau pembayaran.",
      "Jangan memberikan prose di luar JSON.",
    ].join(" "),
  });
  return extractedTransactionSchema.parse(raw);
}

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>;
