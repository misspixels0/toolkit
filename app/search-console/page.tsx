"use client";

import { useEffect, useState } from "react";
import { useQueryError } from "@/lib/hooks";
import { PageHeader, ErrorBanner, Card, btnPrimary, btnGhost } from "@/components/ui";

type Site = { siteUrl: string; permissionLevel: string };
type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

const CONNECT_URL = "/api/auth/google?service=gsc";

export default function SearchConsolePage() {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [activeSite, setActiveSite] = useState<string | null>(null);
  const [dimension, setDimension] = useState<"query" | "page">("query");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useQueryError();

  const [inspectUrl, setInspectUrl] = useState("");
  const [inspectResult, setInspectResult] = useState<any>(null);
  const [inspecting, setInspecting] = useState(false);

  const connected = Boolean(email);

  useEffect(() => {
    (async () => {
      try {
        const acc = await fetch("/api/auth/accounts?service=gsc").then((r) => r.json());
        const connectedEmail: string | null = acc.accounts?.[0]?.email || null;
        setEmail(connectedEmail);
        if (!connectedEmail) return;

        const res = await fetch("/api/gsc/sites");
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || "Properties could not be loaded");
        setSites(d.sites || []);
        if (d.sites?.length) setActiveSite(d.sites[0].siteUrl);
      } catch (e: any) {
        setError(e?.message || "Something went wrong");
      } finally {
        setChecking(false);
      }
    })();
  }, [setError]);

  useEffect(() => {
    if (!activeSite) return;
    setLoading(true);
    setError(null);
    fetch("/api/gsc/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl: activeSite, dimension }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setRows(d.rows || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeSite, dimension, setError]);

  async function disconnect() {
    await fetch("/api/auth/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "gsc" }),
    });
    setEmail(null);
    setSites([]);
    setActiveSite(null);
    setRows([]);
    setInspectResult(null);
  }

  async function handleInspect() {
    if (!activeSite || !inspectUrl) return;
    setInspecting(true);
    setInspectResult(null);
    setError(null);
    try {
      const res = await fetch("/api/gsc/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: activeSite, inspectionUrl: inspectUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Inspection failed");
      setInspectResult(data);
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setInspecting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        letter="P"
        name="PageControl"
        title="Search Console"
        description="Review Google Search Console performance data and check the indexing status of any URL."
        actions={
          connected ? (
            <>
              <span className="max-w-[220px] truncate rounded-full bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                Connected: {email}
              </span>
              <button onClick={disconnect} className={btnGhost}>
                Disconnect
              </button>
            </>
          ) : (
            <a href={CONNECT_URL} className={btnPrimary}>
              Connect Search Console
            </a>
          )
        }
      />

      {error && <ErrorBanner onClose={() => setError(null)}>{error}</ErrorBanner>}

      {checking ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : !connected ? (
        <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-14 text-center shadow-card">
          <p className="text-lg font-medium text-ink-900">Not connected yet</p>
          <p className="mt-2 text-sm text-ink-500">
            Connect Google Search Console to see performance data and URL inspection results.
          </p>
          <a href={CONNECT_URL} className={`${btnPrimary} mt-6 inline-block px-5 py-2.5`}>
            Connect Search Console
          </a>
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <p className="font-medium text-ink-900">No verified properties were found for this account</p>
          <p className="mt-2 text-sm text-ink-500">
            The Google account you signed in with must be an owner or user of a verified Search Console property.
            This tool does not request new access; it only reads the access already granted.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-300">Property</label>
            <select
              value={activeSite || ""}
              onChange={(e) => setActiveSite(e.target.value)}
              className="mt-2 w-full rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
            >
              {sites.map((s) => (
                <option key={s.siteUrl} value={s.siteUrl}>
                  {s.siteUrl}
                </option>
              ))}
            </select>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink-900">Search performance (last 28 days)</h2>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setDimension("query")}
                  className={`rounded-lg px-3 py-1.5 ${
                    dimension === "query" ? "bg-brand-600 text-white" : "bg-canvas text-ink-500"
                  }`}
                >
                  Top queries
                </button>
                <button
                  onClick={() => setDimension("page")}
                  className={`rounded-lg px-3 py-1.5 ${
                    dimension === "page" ? "bg-brand-600 text-white" : "bg-canvas text-ink-500"
                  }`}
                >
                  Top pages
                </button>
              </div>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-ink-500">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="mt-6 text-sm text-ink-500">No data is available for this period yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-900/10 text-left text-ink-300">
                      <th className="py-2 pr-4 font-medium">{dimension === "query" ? "Query" : "Page"}</th>
                      <th className="py-2 pr-4 font-medium">Clicks</th>
                      <th className="py-2 pr-4 font-medium">Impressions</th>
                      <th className="py-2 pr-4 font-medium">CTR</th>
                      <th className="py-2 pr-4 font-medium">Avg. position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-ink-900/5">
                        <td className="max-w-xs truncate py-2 pr-4 text-ink-900">{r.keys[0]}</td>
                        <td className="py-2 pr-4 text-ink-700">{r.clicks}</td>
                        <td className="py-2 pr-4 text-ink-700">{r.impressions}</td>
                        <td className="py-2 pr-4 text-ink-700">{(r.ctr * 100).toFixed(1)}%</td>
                        <td className="py-2 pr-4 text-ink-700">{r.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-ink-900">Inspect a URL</h2>
            <p className="mt-1 text-sm text-ink-500">Check whether a page is indexed in Google and why.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={inspectUrl}
                onChange={(e) => setInspectUrl(e.target.value)}
                placeholder="https://yourdomain.com/some-page"
                className="flex-1 rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
              />
              <button onClick={handleInspect} disabled={inspecting} className={`${btnPrimary} px-5 py-2.5`}>
                {inspecting ? "Checking…" : "Inspect"}
              </button>
            </div>

            {inspectResult && (
              <div className="mt-5 rounded-xl bg-canvas p-4 text-sm">
                <p>
                  <span className="font-medium text-ink-900">Verdict: </span>
                  {inspectResult?.indexStatusResult?.verdict || "Unknown"}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-ink-900">Coverage: </span>
                  {inspectResult?.indexStatusResult?.coverageState || "—"}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-ink-900">Last crawl: </span>
                  {inspectResult?.indexStatusResult?.lastCrawlTime || "—"}
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
