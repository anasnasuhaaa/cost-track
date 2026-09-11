import "server-only";

export class GeminiUnavailableError extends Error {
  constructor(message = "AI sedang tidak tersedia.") { super(message); this.name = "GeminiUnavailableError"; }
}

type InteractionResponse = {
  status?: string;
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
};

export async function requestStructured<T>(options: { input: string; systemInstruction: string; schema: Record<string, unknown>; fetcher?: typeof fetch }): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) throw new GeminiUnavailableError("Konfigurasi AI belum tersedia.");

  const response = await (options.fetcher ?? fetch)("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model,
      input: options.input,
      system_instruction: options.systemInstruction,
      store: false,
      response_format: { type: "text", mime_type: "application/json", schema: options.schema },
      generation_config: { max_output_tokens: 500 },
    }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => { throw new GeminiUnavailableError(); });

  if (!response.ok) throw new GeminiUnavailableError();
  const interaction = (await response.json()) as InteractionResponse;
  const text = interaction.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("");
  if (!text) throw new GeminiUnavailableError("AI tidak menghasilkan respons yang dapat dibaca.");
  try { return JSON.parse(text) as T; }
  catch { throw new GeminiUnavailableError("Respons AI tidak valid."); }
}
