"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "What can I do with this Toolkit Hub?",
  "Explain SEO in simple words",
  "Help me organize a busy day",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not get a reply.");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <main className="page-shell min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto flex min-h-[min(760px,calc(100vh-150px))] max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-900/5 bg-white shadow-card">
        <header className="border-b border-ink-900/5 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              C
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink-900">Chat Assistant</h1>
              <p className="text-sm text-ink-500">Ask anything to get started</p>
            </div>
          </div>
        </header>

        <div
          aria-live="polite"
          className="flex-1 space-y-5 overflow-y-auto bg-canvas/60 px-4 py-6 sm:px-7"
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-[320px] max-w-xl flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-600">
                ✦
              </div>
              <h2 className="mt-4 text-xl font-semibold text-ink-900">How can I help?</h2>
              <p className="mt-2 text-sm text-ink-500">
                Start a conversation or choose a suggestion.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    disabled={loading}
                    className="suggestion-chip rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm text-ink-700 hover:border-brand-200 hover:text-brand-700 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`chat-message flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                    message.role === "user"
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md border border-ink-900/5 bg-white text-ink-700 shadow-sm"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))
          )}
          {loading && (
            <p className="thinking-indicator chat-message w-fit rounded-2xl rounded-bl-md border border-ink-900/5 bg-white px-4 py-3 text-sm text-ink-500 shadow-sm">
              Thinking…
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-ink-900/5 bg-white p-4 sm:px-7 sm:py-5">
          <div className="flex items-end gap-3 rounded-2xl border border-ink-900/10 bg-white p-2 shadow-sm focus-within:border-brand-400">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
              maxLength={4000}
              rows={1}
              aria-label="Your message"
              placeholder="Message the assistant…"
              className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-300"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-ink-300">
            Replies are AI-generated. Avoid sharing sensitive information.
          </p>
        </form>
      </section>
    </main>
  );
}
