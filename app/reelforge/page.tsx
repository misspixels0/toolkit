"use client";

import { useEffect, useState } from "react";
import { useQueryError } from "@/lib/hooks";
import { PageHeader, ErrorBanner, Card, btnPrimary, btnGhost } from "@/components/ui";

export default function ReelForgePage() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(60);
  const [loadingScript, setLoadingScript] = useState(false);
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [error, setError] = useQueryError();

  const [loadingVoice, setLoadingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [srt, setSrt] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const [ytEmail, setYtEmail] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/accounts?service=youtube")
      .then((r) => r.json())
      .then((d) => setYtEmail(d.accounts?.[0]?.email || null))
      .catch(() => setYtEmail(null));
  }, []);

  async function disconnectYoutube() {
    await fetch("/api/auth/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "youtube" }),
    });
    setYtEmail(null);
  }

  async function generateScript() {
    if (!topic.trim()) return;
    setLoadingScript(true);
    setError(null);
    setAudioUrl(null);
    setSrt(null);
    try {
      const res = await fetch("/api/reelforge/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, durationSeconds: duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate script");
      setScript(data.script);
      setScenes(data.scenes || []);
      setTitles(data.titles || []);
      setUploadTitle(data.titles?.[0] || topic);
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setLoadingScript(false);
    }
  }

  async function generateVoiceover() {
    if (!script) return;
    setLoadingVoice(true);
    setError(null);
    setVoiceNote(null);
    try {
      const res = await fetch("/api/reelforge/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate voiceover");
      setSrt(data.srt);
      setVoiceNote(data.note || null);
      if (data.audioBase64) {
        setAudioUrl(`data:audio/mpeg;base64,${data.audioBase64}`);
      }
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setLoadingVoice(false);
    }
  }

  function downloadSrt() {
    if (!srt) return;
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "captions.srt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("video", uploadFile);
      fd.append("title", uploadTitle || topic);
      fd.append("description", script);

      const res = await fetch("/api/youtube/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setUploadResult(data.url);
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        letter="R"
        name="ReelForge"
        title="Faceless YouTube"
        description="Generate scripts, voiceovers, and captions from any topic, assemble the video, and upload it to your channel."
        actions={
          ytEmail ? (
            <>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                Connected: {ytEmail}
              </span>
              <button onClick={disconnectYoutube} className={btnGhost}>
                Disconnect
              </button>
            </>
          ) : (
            <a href="/api/auth/google?service=youtube" className={btnPrimary}>
              Connect YouTube channel
            </a>
          )
        }
      />

      {error && <ErrorBanner onClose={() => setError(null)}>{error}</ErrorBanner>}

      {/* Step 1: script */}
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">1. Generate a script</h2>
        <p className="mt-1 text-sm text-ink-500">
          Enter a topic, choose the length, and generate a narration script with scene and title ideas.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. 5 facts about black holes that sound fake"
            className="flex-1 rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
          />
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
          >
            <option value={30}>30 sec (Short)</option>
            <option value={60}>60 sec (Short)</option>
            <option value={180}>3 min</option>
            <option value={480}>8 min</option>
          </select>
          <button onClick={generateScript} disabled={loadingScript} className={`${btnPrimary} px-5 py-2.5`}>
            {loadingScript ? "Writing…" : "Generate script"}
          </button>
        </div>

        {script && (
          <div className="mt-5 space-y-4">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-ink-900/10 p-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
            />
            {titles.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-300">Title ideas</p>
                <ul className="mt-2 space-y-1">
                  {titles.map((t, i) => (
                    <li key={i} className="text-sm text-ink-700">
                      • {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {scenes.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-300">
                  Suggested visuals per scene
                </p>
                <ul className="mt-2 space-y-1">
                  {scenes.map((s, i) => (
                    <li key={i} className="text-sm text-ink-700">
                      {i + 1}. {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Step 2: voiceover */}
      {script && (
        <Card>
          <h2 className="text-lg font-semibold text-ink-900">2. Generate voiceover &amp; captions</h2>
          <p className="mt-1 text-sm text-ink-500">This converts your script into an MP3 narration and a timed .srt caption file.</p>
          <button onClick={generateVoiceover} disabled={loadingVoice} className={`${btnPrimary} mt-4 px-5 py-2.5`}>
            {loadingVoice ? "Generating…" : "Generate voiceover"}
          </button>

          {voiceNote && <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">{voiceNote}</p>}

          {audioUrl && (
            <div className="mt-4 space-y-2">
              <audio controls src={audioUrl} className="w-full" />
              <a href={audioUrl} download="voiceover.mp3" className={`${btnGhost} inline-block`}>
                Download voiceover.mp3
              </a>
            </div>
          )}

          {srt && (
            <button onClick={downloadSrt} className={`${btnGhost} mt-4 block`}>
              Download captions.srt
            </button>
          )}
        </Card>
      )}

      {/* Step 3: render (manual, local) */}
      {script && (
        <Card>
          <h2 className="text-lg font-semibold text-ink-900">3. Assemble the final video</h2>
          <p className="mt-1 text-sm text-ink-500">
            Download the voiceover and captions above, choose a background video or image for each scene (Pexels or
            Pixabay are good free sources), then run this on your computer:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-900 p-4 text-xs text-white">
            {`node scripts/render-video.js \\
  --audio voiceover.mp3 \\
  --background background.mp4 \\
  --captions captions.srt \\
  --out final.mp4`}
          </pre>
          <p className="mt-2 text-xs text-ink-500">
            FFmpeg must be installed on your local computer. Video rendering does not work on Vercel because
            serverless functions do not include ffmpeg and are also time-limited.
          </p>
        </Card>
      )}

      {/* Step 4: upload */}
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">4. Upload to YouTube</h2>
        <p className="mt-1 text-sm text-ink-500">
          {ytEmail
            ? "Upload the finished MP4 as private and review it before publishing."
            : "Connect your YouTube channel above first, then upload the finished MP4."}
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Video title"
            className="w-full rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
          />
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-ink-700"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !uploadFile || !ytEmail}
            className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload video"}
          </button>
        </div>

        {uploadResult && (
          <p className="mt-4 text-sm text-emerald-700">
            Uploaded (private) —{" "}
            <a className="underline" href={uploadResult} target="_blank" rel="noreferrer">
              {uploadResult}
            </a>
          </p>
        )}
      </Card>
    </main>
  );
}
