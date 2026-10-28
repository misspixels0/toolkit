import { geminiGenerate, geminiResearch } from "@/lib/gemini";

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export type ResearchMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ResearchSource = {
  title: string;
  uri: string;
};

export function hasAIKey() {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
}

async function groqChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  browserSearch = false
) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(browserSearch
        ? {
            tool_choice: "required",
            tools: [{ type: "browser_search" }],
            max_completion_tokens: 4096,
            reasoning_effort: "low",
          }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Groq error (${response.status}) using model "${model}": ${(await response.text()).slice(0, 300)}`
    );
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("The AI returned an empty response. Please try again.");
  }
  return text.trim();
}

export async function aiGenerate(prompt: string): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    return groqChat([{ role: "user", content: prompt }]);
  }
  return geminiGenerate(prompt);
}

function extractSources(text: string): ResearchSource[] {
  const sources: ResearchSource[] = [];
  const sourceIndexes = new Set<string>();
  const links = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|https?:\/\/[^\s)\]]+/g;
  let match: RegExpExecArray | null;

  while ((match = links.exec(text)) !== null) {
    const uri = (match[2] || match[0]).replace(/[.,;:!?]+$/, "");
    try {
      const parsed = new URL(uri);
      if (!["http:", "https:"].includes(parsed.protocol) || sourceIndexes.has(parsed.href)) continue;
      sourceIndexes.add(parsed.href);
      sources.push({ title: match[1] || parsed.hostname, uri: parsed.href });
    } catch {
      continue;
    }
  }

  return sources;
}

function cleanBrowserCitations(text: string) {
  return text.replace(/(?:\[\s*\d*\s*†L\d+(?:-L?\d+)?\s*\]|【\s*\d+†L\d+(?:-L?\d+)?】)/g, "");
}

export async function aiResearch(
  messages: ResearchMessage[],
  researchType: "product" | "law"
): Promise<{ text: string; sources: ResearchSource[] }> {
  if (!process.env.GROQ_API_KEY) return geminiResearch(messages, researchType);

  const instructions =
    researchType === "product"
      ? "You are a product and market research assistant. Search the web for current information. Compare products, features, prices, pros and cons, and market alternatives when relevant. Prefer manufacturer pages and reputable independent sources. Distinguish verified facts from opinions, give dates or note when prices may change, and do not invent facts or citations."
      : "You are a laws and regulations research assistant, not a lawyer. Search the web for current legal information and prioritize official government, court, and regulator sources. Laws depend on jurisdiction: if the user has not specified the country or region and the question depends on it, ask which jurisdiction they mean instead of assuming. Clearly identify jurisdiction and relevant dates, explain uncertainty, and never present the answer as legal advice. Do not invent laws or citations.";
  const systemInstruction = `${instructions} Use browser search. Format the answer clearly with headings, short paragraphs, and bullets; use a table only when it genuinely helps compare items. Do not include a source/citation column or browser citation markers such as [1†L10-L13]. Link claims with normal Markdown links to the actual pages you accessed, and finish with a "Sources" section listing those direct Markdown links. Never invent URLs.`;
  const response = await groqChat(
    [
      { role: "system", content: systemInstruction },
      ...messages,
    ],
    true
  );
  const cleanedResponse = cleanBrowserCitations(response);
  const sources = extractSources(cleanedResponse);
  const sourcesHeading = cleanedResponse.search(/\n(?:#{1,3}\s*)?sources\s*:?\s*\n/i);
  const text = sourcesHeading >= 0 ? cleanedResponse.slice(0, sourcesHeading).trim() : cleanedResponse;

  return { text, sources };
}
