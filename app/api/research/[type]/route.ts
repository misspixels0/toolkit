import { NextRequest, NextResponse } from "next/server";
import { aiResearch, type ResearchMessage } from "@/lib/ai";

export const maxDuration = 60;

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(
  req: NextRequest,
  context: { params: { type: string } }
) {
  const researchType = context.params.type;
  if (researchType !== "product" && researchType !== "law") {
    return NextResponse.json({ error: "Unknown research assistant." }, { status: 404 });
  }

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
        !["user", "assistant"].includes((message as ResearchMessage).role) ||
        typeof (message as ResearchMessage).content !== "string" ||
        !(message as ResearchMessage).content.trim() ||
        (message as ResearchMessage).content.length > MAX_MESSAGE_LENGTH
    )
  ) {
    return NextResponse.json(
      { error: "Send 1–12 non-empty chat messages, each up to 4,000 characters." },
      { status: 400 }
    );
  }

  const chatMessages = messages as ResearchMessage[];
  if (chatMessages[chatMessages.length - 1].role !== "user") {
    return NextResponse.json({ error: "The latest message must be from the user." }, { status: 400 });
  }

  try {
    const result = await aiResearch(chatMessages, researchType);
    return NextResponse.json({ reply: result.text, sources: result.sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research response failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
