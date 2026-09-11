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
  ])("classifies %s", (question, expected) => {
    expect(classifyLocally(question, context).intent).toBe(expected);
  });

  it("rejects arbitrary intents", () => {
    expect(() => assistantIntentSchema.parse({ intent: "RAW_SQL", period: "CURRENT_MONTH", category: null, account: null })).toThrow();
  });

  it("marks unsupported requests instead of expanding capability", () => {
    expect(classifyLocally("beri saran beli saham", context).intent).toBe("UNSUPPORTED");
  });
});
