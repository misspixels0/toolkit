"use client";

import { useEffect, useState } from "react";
import { useQueryError } from "@/lib/hooks";
import { PageHeader, ErrorBanner, btnPrimary } from "@/components/ui";

type Account = { email: string };
type Message = {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
};

const CONNECT_URL = "/api/auth/google?service=gmail";

export default function InboxPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useQueryError();

  useEffect(() => {
    fetch("/api/auth/accounts?service=gmail")
      .then((r) => r.json())
      .then((data) => {
        const list: Account[] = data.accounts || [];
        setAccounts(list);
        if (list.length) setActive(list[0].email);
      })
      .finally(() => setLoadingAccounts(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoadingInbox(true);
    setMessages([]);
    fetch(`/api/gmail/list?email=${encodeURIComponent(active)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setMessages(d.messages || []);
      })
      .catch((e) => setError(e.message || "Inbox could not be loaded"))
      .finally(() => setLoadingInbox(false));
  }, [active, setError]);

  async function removeAccount(email: string) {
    await fetch("/api/auth/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "gmail", email }),
    });
    const next = accounts.filter((a) => a.email !== email);
    setAccounts(next);
    if (active === email) setActive(next[0]?.email || null);
  }

  async function handleSend() {
    if (!active) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromEmail: active,
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      setStatus("Email sent.");
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch (err: any) {
      setStatus(err?.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        letter="I"
        name="InboxHub"
        title="Multi Gmail"
        description="Connect multiple Gmail accounts and manage all your inbox activity from a single dashboard."
        actions={
          <a href={CONNECT_URL} className={btnPrimary}>
            + Connect Gmail account
          </a>
        }
      />

      {error && <ErrorBanner onClose={() => setError(null)}>{error}</ErrorBanner>}

      {loadingAccounts ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-14 text-center shadow-card">
          <p className="text-lg font-medium text-ink-900">No Gmail account connected yet</p>
          <p className="mt-2 text-sm text-ink-500">
            Connect one or more Gmail accounts to view and manage all your mail in one place.
          </p>
          <a href={CONNECT_URL} className={`${btnPrimary} mt-6 inline-block px-5 py-2.5`}>
            Connect Gmail account
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Accounts sidebar */}
          <aside className="space-y-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-ink-300">Connected accounts</p>
            {accounts.map((a) => (
              <div
                key={a.email}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 shadow-sm ${
                  active === a.email ? "border-brand-200 bg-brand-50" : "border-ink-900/5 bg-white"
                }`}
              >
                <button
                  onClick={() => setActive(a.email)}
                  className="flex-1 truncate text-left text-sm font-medium text-ink-900"
                >
                  {a.email}
                </button>
                <button
                  onClick={() => removeAccount(a.email)}
                  className="ml-2 text-xs text-ink-300 hover:text-rose-500"
                >
                  remove
                </button>
              </div>
            ))}
          </aside>

          {/* Inbox */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="truncate text-lg font-semibold text-ink-900">{active}</h2>
              <button
                onClick={() => setComposeOpen(true)}
                className="shrink-0 rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-700"
              >
                Compose
              </button>
            </div>

            {status && <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">{status}</p>}

            {loadingInbox ? (
              <p className="text-sm text-ink-500">Loading inbox…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-ink-500">No messages found.</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-ink-900/5 bg-white p-4 shadow-card">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`truncate text-sm ${m.unread ? "font-semibold text-ink-900" : "text-ink-700"}`}
                      >
                        {m.from}
                      </p>
                      <span className="shrink-0 text-xs text-ink-300">{m.date}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink-900">{m.subject}</p>
                    <p className="mt-1 truncate text-sm text-ink-500">{m.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-ink-900">New message</h3>
            <p className="mt-1 text-xs text-ink-500">Sending as {active}</p>

            <div className="mt-4 space-y-3">
              <input
                placeholder="To"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="w-full rounded-lg border border-ink-900/10 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
              />
              <input
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full rounded-lg border border-ink-900/10 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
              />
              <textarea
                placeholder="Message"
                rows={6}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="w-full rounded-lg border border-ink-900/10 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-500/20"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setComposeOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-ink-500 hover:bg-ink-900/5"
              >
                Cancel
              </button>
              <button onClick={handleSend} disabled={sending} className={btnPrimary}>
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
