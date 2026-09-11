import { describe, expect, it } from "vitest";

import { calculateBalance, monthRange, signedAmount } from "@/lib/finance/calculations";
import { accountUpdateSchema, transactionFiltersSchema, transactionSchema } from "@/lib/finance/validation";

const validTransaction = {
  type: "EXPENSE",
  amount: 18_000,
  accountId: "00000000-0000-4000-8000-000000000001",
  categoryId: "00000000-0000-4000-8000-000000000002",
  description: "Ayam geprek",
  transactionDate: "2026-09-12",
};

describe("financial calculations", () => {
  it("calculates opening balance plus income minus expense", () => {
    expect(calculateBalance(100_000, [{ type: "INCOME", amount: 50_000 }, { type: "EXPENSE", amount: 18_000 }])).toBe(132_000);
    expect(signedAmount({ type: "EXPENSE", amount: 18_000 })).toBe(-18_000);
  });

  it("produces correct month boundaries", () => {
    expect(monthRange("2024-02")).toEqual({ period: "2024-02", start: "2024-02-01", end: "2024-02-29" });
  });
});

describe("finance validation", () => {
  it("accepts canonical integer rupiah transactions", () => {
    expect(transactionSchema.parse(validTransaction)).toMatchObject({ amount: 18_000, source: "MANUAL" });
  });

  it.each([0, -1, 1.5])("rejects invalid amount %s", (amount) => {
    expect(() => transactionSchema.parse({ ...validTransaction, amount })).toThrow();
  });

  it("caps pagination and validates filters", () => {
    expect(() => transactionFiltersSchema.parse({ pageSize: 500 })).toThrow();
  });

  it("does not silently unset account default during a rename", () => {
    expect(accountUpdateSchema.parse({ name: "Bank utama" })).toEqual({ name: "Bank utama" });
  });
});
