import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

/**
 * Shared Google OAuth + account storage for all 3 Google-connected tools
 * (Inbox/Gmail, ReelForge/YouTube, PageControl/Search Console).
 *
 * A single Client ID/Secret and redirect URI (/api/auth/google/callback) are used across the app.
 * The service name is stored in the "state" parameter so the callback knows which tool is connecting.
 *
 * NOTE: tokens are currently stored in httpOnly cookies (DB-free MVP). Before public launch,
 * they should be moved to an encrypted database such as Supabase.
 */

export type Service = "gmail" | "youtube" | "gsc";

export type GoogleAccount = {
  email: string;
  access_token: string;
  refresh_token: string;
  expiry: number; // epoch ms
};

type ServiceConfig = {
  cookie: string;
  multi: boolean; // whether more than one account can be connected
  returnTo: string; // page to return to after OAuth completes
  prompt: string;
  scopes: string[];
};

export const SERVICE_CONFIG: Record<Service, ServiceConfig> = {
  gmail: {
    cookie: "gmail_accounts",
    multi: true,
    returnTo: "/inbox",
    prompt: "consent select_account",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
  },
  youtube: {
    cookie: "yt_account",
    multi: false,
    returnTo: "/reelforge",
    prompt: "consent",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  },
  gsc: {
    cookie: "gsc_account",
    multi: false,
    returnTo: "/search-console",
    prompt: "consent",
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/webmasters",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  },
};

export function isService(value: string | null | undefined): value is Service {
  return value === "gmail" || value === "youtube" || value === "gsc";
}

// ---------- OAuth ----------

export function getRedirectUri(origin: string) {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
}

export function buildAuthUrl(service: Service, state: string, origin: string) {
  const cfg = SERVICE_CONFIG[service];
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: cfg.scopes.join(" "),
    access_type: "offline",
    prompt: cfg.prompt,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, origin: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(origin),
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(refresh_token: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

export async function getUserEmail(access_token: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!res.ok) throw new Error("Could not fetch account email");
  const data = await res.json();
  return data.email as string;
}

export async function getFreshAccessToken(account: GoogleAccount): Promise<string> {
  if (account.expiry > Date.now() + 60_000) return account.access_token;
  if (!account.refresh_token) {
    throw new Error("Session expired. Please disconnect and connect this account again.");
  }
  const tokens = await refreshAccessToken(account.refresh_token);
  return tokens.access_token;
}

// ---------- Cookie-based account store ----------

export function readAccounts(service: Service): GoogleAccount[] {
  const raw = cookies().get(SERVICE_CONFIG[service].cookie)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** The first (or only) connected account. Used for YouTube / Search Console. */
export function readAccount(service: Service): GoogleAccount | null {
  return readAccounts(service)[0] || null;
}

export function writeAccounts(res: NextResponse, service: Service, accounts: GoogleAccount[]) {
  const name = SERVICE_CONFIG[service].cookie;
  if (accounts.length === 0) {
    res.cookies.delete(name);
    return;
  }
  res.cookies.set(name, Buffer.from(JSON.stringify(accounts)).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export const OAUTH_STATE_COOKIE = "oauth_state";
