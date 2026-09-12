import "server-only";

export class GeminiUnavailableError extends Error {
  constructor(message = "AI sedang tidak tersedia.", public readonly status?: number) {
    super(message);
    this.name = "GeminiUnavailableError";
  }
}

type GenerateContentResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export async function requestStructured<T>(options: { input: string; systemInstruction: string; schema: Record<string, unknown>; fetcher?: typeof fetch }): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) throw new GeminiUnavailableError("Konfigurasi AI belum tersedia.");

  const modelId = model.replace(/^models\//, "");
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: options.input }] }],
        systemInstruction: { parts: [{ text: options.systemInstruction }] },
        generationConfig: {
          maxOutputTokens: 500,
          responseFormat: { text: { mimeType: "APPLICATION_JSON", schema: options.schema } },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new GeminiUnavailableError(timedOut ? "Permintaan Gemini melewati batas waktu." : "Tidak dapat terhubung ke Gemini.");
  }

  if (!response.ok) {
    const providerError = await response.json().catch(() => null) as { error?: { status?: string } } | null;
    const providerStatus = providerError?.error?.status;
    throw new GeminiUnavailableError(`Gemini menolak permintaan${providerStatus ? ` (${providerStatus})` : ""}.`, response.status);
  }
  const result = (await response.json()) as GenerateContentResponse;
  const text = result.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");
  if (!text) throw new GeminiUnavailableError("AI tidak menghasilkan respons yang dapat dibaca.");
  try { return JSON.parse(text) as T; }
  catch { throw new GeminiUnavailableError("Respons AI tidak valid."); }
}
