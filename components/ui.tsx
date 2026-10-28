import type { ReactNode } from "react";

/** Header block for each tool page. The `actions` slot can include Connect/Disconnect buttons. */
export function PageHeader({
  letter,
  name,
  title,
  description,
  actions,
}: {
  letter: string;
  name: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          {letter}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            {name} <span className="font-normal text-ink-300">· {title}</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorBanner({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <p className="break-words">{children}</p>
      {onClose && (
        <button onClick={onClose} className="shrink-0 text-rose-400 hover:text-rose-700" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card ${className}`}>{children}</div>
  );
}

export const btnPrimary =
  "rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60";
export const btnGhost =
  "rounded-xl border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5";
