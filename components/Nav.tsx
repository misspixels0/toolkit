"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/lib/tools";

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 items-center justify-center overflow-hidden">
            <Image
              src="/toolkit.png"
              alt="Toolkit Hub logo"
              width={140}
              height={32}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {TOOLS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.slug}
                href={t.href}
                className={`nav-link shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                }`}
              >
                {t.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
