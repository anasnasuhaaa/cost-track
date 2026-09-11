import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Nama akun wajib diisi.").max(60),
  type: z.enum(["CASH", "BANK", "EWALLET", "OTHER"]),
  openingBalance: z.coerce.number().int().min(-2_000_000_000).max(2_000_000_000),
  isDefault: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(60),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().int().positive().max(2_000_000_000),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().trim().min(1).max(160),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  source: z.enum(["MANUAL", "AI"]).optional().default("MANUAL"),
});

export const transactionFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(80).optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
