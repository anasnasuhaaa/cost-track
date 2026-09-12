import { afterEach, describe, expect, it, vi } from "vitest";

import { GeminiUnavailableError, requestStructured } from "@/lib/ai/gemini";
import { extractTransaction } from "@/lib/ai/smart-input";

afterEach(() => {
  vi.unstubAllEnvs();
});

function generatedContent(text: string, status = 200) {
  return new Response(JSON.stringify(status === 200 ? { candidates: [{ content: { parts: [{ text }] } }] } : { error: { status: "RESOURCE_EXHAUSTED" } }), { status, headers: { "Content-Type": "application/json" } });
}

describe("Gemini structured output", () => {
  it("parses structured generateContent output", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    const fetcher = vi.fn(async () => generatedContent('{"amount":15000}')) as unknown as typeof fetch;
    const value = await requestStructured<{ amount: number }>({ input: "kopi 15k", systemInstruction: "extract", schema: { type: "object" }, fetcher });
    expect(value.amount).toBe(15_000);
    expect(fetcher).toHaveBeenCalledWith("https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent", expect.objectContaining({ method: "POST" }));
    const request = JSON.parse(String(vi.mocked(fetcher).mock.calls[0][1]?.body));
    expect(request.generationConfig.responseFormat.text.mimeType).toBe("APPLICATION_JSON");
    expect(request.generationConfig).not.toHaveProperty("thinkingConfig");
  });

  it("fails safely when configuration is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_MODEL", "");
    await expect(requestStructured({ input: "x", systemInstruction: "x", schema: {} })).rejects.toBeInstanceOf(GeminiUnavailableError);
  });

  it("fails safely on provider errors and invalid JSON", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    await expect(requestStructured({ input: "x", systemInstruction: "x", schema: {}, fetcher: vi.fn(async () => generatedContent("", 429)) as typeof fetch })).rejects.toMatchObject({ status: 429 });
    await expect(requestStructured({ input: "x", systemInstruction: "x", schema: {}, fetcher: vi.fn(async () => generatedContent("not-json")) as typeof fetch })).rejects.toBeInstanceOf(GeminiUnavailableError);
  });

  it("validates extracted financial fields with Zod", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    const result = await extractTransaction("kemarin ayam geprek 18k", { accountNames: ["Cash"], categoryNames: ["Makanan"], fetcher: vi.fn(async () => generatedContent(JSON.stringify({ type: "EXPENSE", amount: 18000, description: "Ayam geprek", category: "Makanan", account: null, transactionDate: "2026-09-11" }))) as typeof fetch });
    expect(result).toMatchObject({ type: "EXPENSE", amount: 18_000, category: "Makanan" });
  });

  it("rejects incomplete or invalid provider values", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "test-model");
    await expect(extractTransaction("makan", { accountNames: ["Cash"], categoryNames: ["Makanan"], fetcher: vi.fn(async () => generatedContent(JSON.stringify({ type: "EXPENSE", amount: -1, description: null, category: "Makanan", account: null, transactionDate: null }))) as typeof fetch })).rejects.toThrow();
  });
});
