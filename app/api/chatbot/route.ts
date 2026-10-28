import { NextRequest, NextResponse } from "next/server";
import { aiGenerate, hasAIKey } from "@/lib/ai";

export const maxDuration = 60;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown } | null)?.messages;
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (message) =>
        !message ||
        typeof message !== "object" ||
        !("role" in message) ||
        !("content" in message) ||
        !["user", "assistant"].includes((message as ChatMessage).role) ||
        typeof (message as ChatMessage).content !== "string" ||
        !(message as ChatMessage).content.trim() ||
        (message as ChatMessage).content.length > MAX_MESSAGE_LENGTH
    )
  ) {
    return NextResponse.json(
      { error: "Send 1–12 non-empty chat messages, each up to 4,000 characters." },
      { status: 400 }
    );
  }

  const chatMessages = messages as ChatMessage[];
  if (chatMessages[chatMessages.length - 1].role !== "user") {
    return NextResponse.json({ error: "The latest message must be from the user." }, { status: 400 });
  }

  if (!hasAIKey()) {
    return NextResponse.json(
      { error: "Set GROQ_API_KEY or GEMINI_API_KEY in .env.local to use the AI assistant." },
      { status: 400 }
    );
  }

  const prompt = [
    "You are a helpful, clear, and friendly assistant in Toolkit Hub. Reply in the language the user uses.",
    "Conversation:",
    ...chatMessages.map(
      (message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content.trim()}`
    ),
    "Assistant:",
  ].join("\n\n");

  try {
    const reply = await aiGenerate(prompt);
    if (!reply) throw new Error("The AI returned an empty response. Please try again.");
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat response failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
