import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

function buildSrt(text: string, wpm = 150) {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let cursor = 0; // seconds
  const lines: string[] = [];

  sentences.forEach((sentence, i) => {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    const duration = Math.max(1.2, (wordCount / wpm) * 60);
    const start = cursor;
    const end = cursor + duration;
    cursor = end;

    const fmt = (t: number) => {
      const h = String(Math.floor(t / 3600)).padStart(2, "0");
      const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
      const s = String(Math.floor(t % 60)).padStart(2, "0");
      const ms = String(Math.round((t % 1) * 1000)).padStart(3, "0");
      return `${h}:${m}:${s},${ms}`;
    };

    lines.push(`${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${sentence}\n`);
  });

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const { text, voice } = await req.json();
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const srt = buildSrt(text);
  const voiceRssKey = process.env.VOICERSS_API_KEY;

  if (!voiceRssKey) {
    // Still return captions even without a TTS key, so the tool stays useful.
    return NextResponse.json({
      audioBase64: null,
      srt,
      note: "VOICERSS_API_KEY not set — captions generated, but no audio. Get a free key at voicerss.org/api",
    });
  }

  try {
    const params = new URLSearchParams({
      key: voiceRssKey,
      hl: voice || "en-us",
      src: text,
      f: "44khz_16bit_stereo",
    });
    const res = await fetch(`https://api.voicerss.org/?${params.toString()}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    // VoiceRSS returns plain text starting with "ERROR" on failure instead of audio bytes
    if (buffer.slice(0, 5).toString("utf-8").toUpperCase().startsWith("ERROR")) {
      throw new Error(buffer.toString("utf-8"));
    }

    return NextResponse.json({
      audioBase64: buffer.toString("base64"),
      srt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Voiceover generation failed", srt }, { status: 500 });
  }
}
