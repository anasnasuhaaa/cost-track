import { describe, expect, it } from "vitest";

import { assistantIntentSchema, classifyLocally } from "@/lib/ai/assistant";

const context = { categoryNames: ["Makanan", "Transportasi"], accountNames: ["Cash", "BCA"] };

describe("assistant intent whitelist", () => {
  it.each([
    ["bulan ini paling boros apa?", "TOP_CATEGORIES"],
    ["berapa pengeluaran Makanan bulan ini?", "CATEGORY_SPENDING"],
    ["berapa pemasukan saya bulan ini?", "INCOME_TOTAL"],
    ["bandingkan bulan ini dan bulan lalu", "PERIOD_COMPARISON"],
    ["berapa saldo BCA?", "ACCOUNT_BALANCE"],
    ["tampilkan transaksi terbaru", "RECENT_TRANSACTIONS"],
    ["berapa pengeluaran hari ini?", "EXPENSE_TOTAL"],
    ["berapa pengeluaran selama 3 hari ke belakang?", "EXPENSE_TOTAL"],
    ["pemasukan kemarin", "INCOME_TOTAL"],
    ["pengeluaran 7 hari terakhir", "EXPENSE_TOTAL"],
    ["sisa uang saya berapa?", "ACCOUNT_BALANCE"],
    ["uang paling banyak habis untuk apa?", "TOP_CATEGORIES"],
    ["gimana kondisi keuangan saya?", "CURRENT_MONTH_SUMMARY"],
    ["tampilkan riwayat transaksi", "RECENT_TRANSACTIONS"],
  ])("classifies %s", (question, expected) => {
    expect(classifyLocally(question, context).intent).toBe(expected);
  });

  it("rejects arbitrary intents", () => {
    expect(() => assistantIntentSchema.parse({ intent: "RAW_SQL", period: "CURRENT_MONTH", category: null, account: null })).toThrow();
  });

  it.each([
    ["berapa pengeluaran hari ini?", "TODAY"],
    ["berapa pengeluaran selama 3 hari ke belakang?", "LAST_3_DAYS"],
    ["pemasukan kemarin", "YESTERDAY"],
    ["pengeluaran 7 hari terakhir", "LAST_7_DAYS"],
    ["pengeluaran minggu ini", "CURRENT_WEEK"],
    ["pengeluaran sepekan terakhir", "LAST_7_DAYS"],
  ])("detects the period in %s", (question, expected) => {
    expect(classifyLocally(question, context).period).toBe(expected);
  });

  it("marks unsupported requests instead of expanding capability", () => {
    expect(classifyLocally("beri saran beli saham", context).intent).toBe("UNSUPPORTED");
  });
});
