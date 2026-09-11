import { afterEach, describe, expect, it, vi } from "vitest";

import { GeminiUnavailableError, requestStructured } from "@/lib/ai/gemini";
import { extractTransaction } from "@/lib/ai/smart-input";

afterEach(() => {
  vi.unstubAllEnvs();
});

function interaction(text: string, status = 200) {
  return new Response(JSON.stringify({ status: status === 200 ? "completed" : "failed", steps: [{ type: "model_output", content: [{ type: "text", text }] }] }), { status, headers: { "Content-Type": "application/json" } });
}

describe("Gemini structured output", () => {
  it("parses structured interaction output", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    const value = await requestStructured<{ amount: number }>({ input: "kopi 15k", systemInstruction: "extract", schema: { type: "object" }, fetcher: vi.fn(async () => interaction('{"amount":15000}')) as typeof fetch });
    expect(value.amount).toBe(15_000);
  });

  it("fails safely when configuration is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_MODEL", "");
    await expect(requestStructured({ input: "x", systemInstruction: "x", schema: {} })).rejects.toBeInstanceOf(GeminiUnavailableError);
  });

  it("fails safely on provider errors and invalid JSON", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    await expect(requestStructured({ input: "x", systemInstruction: "x", schema: {}, fetcher: vi.fn(async () => interaction("", 429)) as typeof fetch })).rejects.toBeInstanceOf(GeminiUnavailableError);
    await expect(requestStructured({ input: "x", systemInstruction: "x", schema: {}, fetcher: vi.fn(async () => interaction("not-json")) as typeof fetch })).rejects.toBeInstanceOf(GeminiUnavailableError);
  });

  it("validates extracted financial fields with Zod", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    const result = await extractTransaction("kemarin ayam geprek 18k", { accountNames: ["Cash"], categoryNames: ["Makanan"], fetcher: vi.fn(async () => interaction(JSON.stringify({ type: "EXPENSE", amount: 18000, description: "Ayam geprek", category: "Makanan", account: null, transactionDate: "2026-09-11" }))) as typeof fetch });
    expect(result).toMatchObject({ type: "EXPENSE", amount: 18_000, category: "Makanan" });
  });

  it("rejects incomplete or invalid provider values", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    await expect(extractTransaction("makan", { accountNames: ["Cash"], categoryNames: ["Makanan"], fetcher: vi.fn(async () => interaction(JSON.stringify({ type: "EXPENSE", amount: -1, description: null, category: "Makanan", account: null, transactionDate: null }))) as typeof fetch })).rejects.toThrow();
  });
});
