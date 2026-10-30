"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolIcon from "@/components/ToolIcon";

type Source = {
  title: string;
  uri: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

type ResearchChatProps = {
  type: "product" | "law" | "science" | "medical" | "business" | "language";
  title: string;
  subtitle: string;
  description: string;
  suggestions: string[];
  notice?: string;
};

export default function ResearchChat({
  type,
  title,
  subtitle,
  description,
  suggestions,
  notice,
}: ResearchChatProps) {
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
      const res = await fetch(`/api/research/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not get research results.");
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply,
          sources: type === "language" ? undefined : data.sources || [],
        },
      ]);
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ToolIcon icon={type} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
              <p className="text-sm text-ink-500">{subtitle}</p>
            </div>
          </div>
          {notice && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>
          )}
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
              <h2 className="mt-4 text-xl font-semibold text-ink-900">{description}</h2>
              <p className="mt-2 text-sm text-ink-500">
                {type === "language"
                  ? "Practice at your level; ask for explanations, corrections, or conversation."
                  : "Web search is enabled; answers include source links when available."}
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
                <div className="max-w-[90%] sm:max-w-[80%]">
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-sm leading-6 text-white">
                      {message.content}
                    </p>
                  ) : (
                    <div className="rounded-2xl rounded-bl-md border border-ink-900/5 bg-white px-4 py-3 text-sm leading-6 text-ink-700 shadow-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="mb-3 mt-5 text-lg font-semibold text-ink-900 first:mt-0">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="mb-2 mt-4 text-base font-semibold text-ink-900 first:mt-0">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="mb-2 mt-4 font-semibold text-ink-900 first:mt-0">{children}</h3>
                          ),
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                          li: ({ children }) => <li className="pl-1">{children}</li>,
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900"
                            >
                              {children}
                            </a>
                          ),
                          table: ({ children }) => (
                            <div className="mb-3 max-w-full overflow-x-auto last:mb-0">
                              <table className="w-full border-collapse text-left text-xs">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-canvas">{children}</thead>,
                          th: ({ children }) => (
                            <th className="border border-ink-900/10 px-3 py-2 font-semibold text-ink-900">{children}</th>
                          ),
                          td: ({ children }) => <td className="border border-ink-900/10 px-3 py-2 align-top">{children}</td>,
                          blockquote: ({ children }) => (
                            <blockquote className="mb-3 border-l-2 border-brand-200 pl-3 text-ink-500 last:mb-0">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children, className }) => (
                            <code className={`${className || ""} rounded bg-canvas px-1 py-0.5 text-[0.85em]`}>
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="mb-3 overflow-x-auto rounded-lg bg-canvas p-3 text-xs last:mb-0">
                              {children}
                            </pre>
                          ),
                          hr: () => <hr className="my-4 border-ink-900/10" />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 rounded-xl border border-ink-900/5 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Sources</p>
                      <ol className="space-y-1.5">
                        {message.sources.map((source, sourceIndex) => (
                          <li key={source.uri} className="text-xs leading-5">
                            <span className="mr-1 text-ink-400">[{sourceIndex + 1}]</span>
                            <a
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900"
                            >
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {message.role === "assistant" && message.sources?.length === 0 && (
                    <p className="mt-2 text-xs text-ink-400">No source links were returned for this answer.</p>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <p className="thinking-indicator chat-message w-fit rounded-2xl rounded-bl-md border border-ink-900/5 bg-white px-4 py-3 text-sm text-ink-500 shadow-sm">
              {type === "language" ? "Thinking…" : "Searching the web…"}
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
              aria-label={`Ask ${title}`}
              placeholder="Ask your research question…"
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
            AI research may be incomplete. Verify important details with the linked sources.
          </p>
        </form>
      </section>
    </main>
  );
}
