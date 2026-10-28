import Link from "next/link";
import { TOOLS } from "@/lib/tools";

// Environment variables are checked on each request; only the true/false status is shown, never the value.
export const dynamic = "force-dynamic";

export default function Hub() {
  return (
    <main className="min-h-screen">
      <section className="bg-grid relative overflow-hidden bg-canvas">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-1.5 text-sm text-ink-500 shadow-sm">
            7 tools · 1 app · 1 login setup
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
            Toolkit Hub
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-500 sm:text-lg">
            Website review, Gmail, YouTube, Search Console, and research assistants in one place. Choose a tool below.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-4">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.slug}
              href={t.href}
              className="group flex flex-col rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
                  {t.letter}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">{t.name}</h2>
                  <p className="text-xs text-ink-300">{t.title}</p>
                </div>
                <span className="ml-auto rounded-full bg-canvas px-3 py-1 text-xs text-ink-500">{t.login}</span>
              </div>

              <p className="mt-4 flex-1 text-sm text-ink-500">{t.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {t.env.map((e) => {
                  const ok = e.anyOf
                    ? e.anyOf.some((key) => Boolean(process.env[key]))
                    : Boolean(process.env[e.key]);
                  return (
                    <span
                      key={e.key}
                      title={ok ? "Set" : e.optional ? "Optional, not set" : "Not set (required)"}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                        ok
                          ? "bg-emerald-50 text-emerald-700"
                          : e.optional
                          ? "bg-canvas text-ink-500"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          ok ? "bg-emerald-500" : e.optional ? "bg-ink-300" : "bg-amber-500"
                        }`}
                      />
                      {e.label}
                    </span>
                  );
                })}
              </div>

              <span className="mt-5 text-sm font-medium text-brand-600 group-hover:text-brand-700">
                Open {t.name} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
