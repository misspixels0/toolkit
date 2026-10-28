/**
 * Shared Gemini helper (free tier). The model name comes from the GEMINI_MODEL env var,
 * because Google regularly retires older models such as gemini-1.5-flash.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type GeminiResearchMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GeminiResearchSource = {
  title: string;
  uri: string;
};

export async function geminiResearch(
  messages: GeminiResearchMessage[],
  researchType: "product" | "law"
): Promise<{ text: string; sources: GeminiResearchSource[] }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const instructions =
    researchType === "product"
      ? "You are a product and market research assistant. Search the web for current information. Compare products, features, prices, pros and cons, and market alternatives when relevant. Prefer manufacturer pages and reputable independent sources. Distinguish verified facts from opinions, give dates or note when prices may change, and do not invent facts or citations."
      : "You are a laws and regulations research assistant, not a lawyer. Search the web for current legal information and prioritize official government, court, and regulator sources. Laws depend on jurisdiction: if the user has not specified the country or region and the question depends on it, ask which jurisdiction they mean instead of assuming. Clearly identify jurisdiction and relevant dates, explain uncertainty, and never present the answer as legal advice. Do not invent laws or citations.";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        tools: [{ google_search: {} }],
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini error (${res.status}) using model "${model}": ${(await res.text()).slice(0, 300)}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .filter((part: { text?: unknown; thought?: boolean }) => typeof part.text === "string" && !part.thought)
    .map((part: { text: string }) => part.text)
    .join("")
    .trim();

  if (!text) throw new Error("The AI returned an empty response. Please try again.");

  const chunks = candidate?.groundingMetadata?.groundingChunks || [];
  const sources: GeminiResearchSource[] = [];
  const sourceIndexes = new Map<string, number>();
  const citations: Array<{ endIndex: number; sourceIndexes: number[] }> = [];

  for (const support of candidate?.groundingMetadata?.groundingSupports || []) {
    const endIndex = support?.segment?.endIndex;
    if (typeof endIndex !== "number" || !Array.isArray(support.groundingChunkIndices)) continue;

    const indexes: number[] = support.groundingChunkIndices
      .map((chunkIndex: number) => chunks[chunkIndex]?.web)
      .filter((web: { uri?: unknown } | undefined): web is { uri: string; title?: string } => (
        typeof web?.uri === "string" && /^https?:\/\//i.test(web.uri)
      ))
      .map((web: { uri: string; title?: string }) => {
        let index = sourceIndexes.get(web.uri);
        if (index === undefined) {
          index = sources.length;
          sourceIndexes.set(web.uri, index);
          sources.push({ title: web.title || web.uri, uri: web.uri });
        }
        return index;
      });

    if (indexes.length) citations.push({ endIndex, sourceIndexes: Array.from(new Set<number>(indexes)) });
  }

  let citedText = text;
  for (const citation of citations.sort((a, b) => b.endIndex - a.endIndex)) {
    const position = Math.min(citation.endIndex, citedText.length);
    citedText =
      citedText.slice(0, position) +
      citation.sourceIndexes.map((index) => ` [${index + 1}]`).join("") +
      citedText.slice(position);
  }

  return { text: citedText, sources };
}

export async function geminiGenerate(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini error (${res.status}) using model "${model}": ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("")
    .trim();
}
