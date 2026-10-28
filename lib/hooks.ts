"use client";

import { useEffect, useState } from "react";

/** When OAuth fails, the callback redirects back with "?error=..."; this hook reads and clears it. */
export function useQueryError() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) {
      setError(e);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  return [error, setError] as const;
}
