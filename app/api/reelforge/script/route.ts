import { NextRequest, NextResponse } from "next/server";
import { aiGenerate, hasAIKey } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { topic, durationSeconds } = await req.json();
  if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  if (!hasAIKey()) {
    return NextResponse.json(
      { error: "Set GROQ_API_KEY or GEMINI_API_KEY in .env.local to generate scripts." },
      { status: 400 }
    );
  }

  const seconds = durationSeconds || 60;
  const words = Math.round((seconds / 60) * 150); // ~150 wpm narration pace

  const prompt = `Write a faceless YouTube video script about: "${topic}".
Target length: about ${words} words (for a ${seconds}-second voiceover).
Format as plain narration only (no scene directions, no markdown) split into short paragraphs,
each paragraph being one "scene". Start with a strong hook in the first sentence. End with a short call to action.
After the script, on a new line write "---SCENES---" and then list one short visual description per scene
(one line each, matching the paragraphs above, describing what stock footage/image would fit), so the total
scene count matches the number of script paragraphs.
Also on a new line write "---TITLE---" followed by 3 punchy YouTube title ideas, one per line.`;

  try {
    const text = await aiGenerate(prompt);

    const [scriptPart, rest] = text.split("---SCENES---");
    const [scenesPart, titlesPart] = (rest || "").split("---TITLE---");

    const script = (scriptPart || "").trim();
    const scenes = (scenesPart || "")
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const titles = (titlesPart || "")
      .split("\n")
      .map((s: string) => s.replace(/^[-\d.]+\s*/, "").trim())
      .filter(Boolean);

    return NextResponse.json({ script, scenes, titles });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Script generation failed" }, { status: 500 });
  }
}
