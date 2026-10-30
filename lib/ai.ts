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
  browserSearch = false,
  apiKey = process.env.GROQ_API_KEY
) {
  if (!apiKey) throw new Error("The Groq API key is not set");
  const key = apiKey;

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
            tool_choice: "auto",
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
  researchType: "product" | "law" | "science" | "medical" | "business" | "language"
): Promise<{ text: string; sources: ResearchSource[] }> {
  const groqApiKey = researchType === "science"
    ? process.env.SCIENCE_GROQ_API_KEY
    : researchType === "medical"
    ? process.env.MEDICAL_GROQ_API_KEY
    : researchType === "business" || researchType === "language"
    ? process.env.SPECIALIST_GROQ_API_KEY
    : process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    if (researchType === "science" || researchType === "medical" || researchType === "business" || researchType === "language") {
      const keyName = researchType === "science"
        ? "SCIENCE_GROQ_API_KEY"
        : researchType === "medical"
        ? "MEDICAL_GROQ_API_KEY"
        : "SPECIALIST_GROQ_API_KEY";
      throw new Error(`${keyName} is not set.`);
    }
    return geminiResearch(messages, researchType);
  }

  const instructions =
    researchType === "language"
      ? "You are a friendly, patient language tutor. Help learners practice any language and adapt to the language and level they request. Correct mistakes kindly, explain grammar and word choice simply, provide natural examples, and keep conversation practice interactive. If the learner does not specify a target language, ask which language they want to learn. Do not claim a learner is wrong when their phrasing is also valid; explain differences in register or dialect when relevant."
      : researchType === "business"
      ? "You are a business research assistant. Search for current information about industries, markets, competitors, customer segments, business models, and opportunities. Prioritize reliable company filings, official statistics, industry reports, and reputable news. Clearly separate sourced facts from estimates or analysis, note dates and geographic scope, and do not invent facts, figures, or citations."
      : researchType === "product"
      ? "You are a product and market research assistant. Search the web for current information. Compare products, features, prices, pros and cons, and market alternatives when relevant. Prefer manufacturer pages and reputable independent sources. Distinguish verified facts from opinions, give dates or note when prices may change, and do not invent facts or citations."
      : researchType === "law"
      ? "You are a laws and regulations research assistant, not a lawyer. Search the web for current legal information and prioritize official government, court, and regulator sources. Laws depend on jurisdiction: if the user has not specified the country or region and the question depends on it, ask which jurisdiction they mean instead of assuming. Clearly identify jurisdiction and relevant dates, explain uncertainty, and never present the answer as legal advice. Do not invent laws or citations."
      : researchType === "science"
      ? "You are a science research assistant. Search for current evidence and prioritize peer-reviewed research, systematic reviews, established scientific institutions, and primary sources when appropriate. Explain methods and limitations, distinguish consensus from emerging or disputed findings, and note publication dates. Do not invent study results, citations, or certainty."
      : "You are a medical research information assistant, not a clinician. Search for current evidence and prioritize authoritative public health agencies, clinical guidelines, systematic reviews, and peer-reviewed medical research. Explain evidence quality, uncertainty, and publication dates; do not diagnose, prescribe, or give personalized treatment instructions. Encourage consulting a qualified healthcare professional for personal medical decisions, and direct emergencies to local emergency services. Do not invent medical claims or citations.";
  if (researchType === "language") {
    const response = await groqChat([
      { role: "system", content: instructions },
      ...messages,
    ], false, groqApiKey);
    return { text: response, sources: [] };
  }

  const systemInstruction = `${instructions} Use browser search. Format the answer clearly with headings, short paragraphs, and bullets; use a table only when it genuinely helps compare items. Do not include a source/citation column or browser citation markers such as [1†L10-L13]. Link claims with normal Markdown links to the actual pages you accessed, and finish with a "Sources" section listing those direct Markdown links. Never invent URLs.`;
  const response = await groqChat(
    [
      { role: "system", content: systemInstruction },
      ...messages,
    ],
    true,
    groqApiKey
  );
  const cleanedResponse = cleanBrowserCitations(response);
  const sources = extractSources(cleanedResponse);
  const sourcesHeading = cleanedResponse.search(/\n(?:#{1,3}\s*)?sources\s*:?\s*\n/i);
  const text = sourcesHeading >= 0 ? cleanedResponse.slice(0, sourcesHeading).trim() : cleanedResponse;

  return { text, sources };
}
