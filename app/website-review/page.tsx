"use client";

import { useState, FormEvent } from "react";

type CategoryScore = {
  id: string;
  title: string;
  score: number | null;
};

type Audit = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
};

type ReportData = {
  url: string;
  finalUrl: string;
  categories: CategoryScore[];
  audits: Audit[];
  aiSummary: string | null;
};

function scoreColor(score: number | null) {
  if (score === null) return "text-ink-300";
  if (score >= 90) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

function scoreRing(score: number | null) {
  if (score === null) return "stroke-ink-300";
  if (score >= 90) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-rose-500";
}

function ScoreGauge({ title, score }: { title: string; score: number | null }) {
  const safe = score ?? 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#EEF0FF" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={scoreRing(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-semibold ${scoreColor(score)}`}>
            {score === null ? "—" : score}
          </span>
        </div>
      </div>
      <p className="text-center text-sm font-medium text-ink-700">{title}</p>
    </div>
  );
}

export default function WebsiteReviewPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/website-review/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not analyze this site.");
      }
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell min-h-screen">
      {/* Hero */}
      <section className="bg-grid relative overflow-hidden bg-canvas">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-1.5 text-sm text-ink-500 shadow-sm">
            Free website checks, no PageSpeed API key
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
            Find practical ways to improve your website
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-500 sm:text-lg">
            Paste a website address for quick SEO, accessibility, and best-practice
            checks, plus an estimated response-time check.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourwebsite.com"
              className="flex-1 rounded-xl border border-ink-900/10 bg-white px-4 py-3 text-ink-900 shadow-sm outline-none ring-brand-500/30 placeholder:text-ink-300 focus:ring-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing…" : "Check my site"}
            </button>
          </form>

          {error && (
            <p className="mx-auto mt-4 max-w-xl rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Results */}
      {report && (
        <section className="chat-message mx-auto max-w-5xl px-6 py-14">
          <div className="mb-8">
            <p className="text-sm text-ink-500">Report for</p>
            <h2 className="text-xl font-semibold text-ink-900 break-all">
              {report.finalUrl}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {report.categories.map((c) => (
              <ScoreGauge key={c.id} title={c.title} score={c.score} />
            ))}
          </div>

          {report.aiSummary && (
            <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <p className="text-sm font-medium text-brand-700">Summary</p>
              <p className="mt-2 whitespace-pre-line text-ink-700">{report.aiSummary}</p>
            </div>
          )}

          {report.audits.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-ink-900">
                Things worth fixing
              </h3>
              <div className="space-y-3">
                {report.audits.map((a) => (
                  <div
                    key={a.id}
                    className="chat-message rounded-xl border border-ink-900/5 bg-white p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-medium text-ink-900">{a.title}</p>
                      {a.displayValue && (
                        <span className="shrink-0 rounded-full bg-canvas px-3 py-1 text-xs text-ink-500">
                          {a.displayValue}
                        </span>
                      )}
                    </div>
                    {a.description && (
                      <p className="mt-2 text-sm text-ink-500">{a.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <footer className="border-t border-ink-900/5 py-8">
        <p className="mx-auto max-w-3xl px-6 text-center text-sm text-ink-400">
          This free checker fetches the page directly. Scores are lightweight estimates, not Google
          Lighthouse or PageSpeed Insights lab results.
        </p>
      </footer>
    </main>
  );
}
