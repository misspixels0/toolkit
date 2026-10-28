import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserEmail,
  isService,
  OAUTH_STATE_COOKIE,
  readAccounts,
  SERVICE_CONFIG,
  writeAccounts,
  GoogleAccount,
} from "@/lib/google";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const state = req.nextUrl.searchParams.get("state") || "";
  const service = state.split(".")[0];

  // State check (CSRF protection) + identify which tool is connecting
  const savedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!isService(service) || !savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Login session expired. Please try again.")}`, origin)
    );
  }

  const cfg = SERVICE_CONFIG[service];
  const fail = (msg: string) => {
    const r = NextResponse.redirect(new URL(`${cfg.returnTo}?error=${encodeURIComponent(msg)}`, origin));
    r.cookies.delete(OAUTH_STATE_COOKIE);
    return r;
  };

  const googleError = req.nextUrl.searchParams.get("error");
  if (googleError) return fail(googleError === "access_denied" ? "Access denied" : googleError);

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return fail("missing_code");

  try {
    const tokens = await exchangeCodeForTokens(code, origin);
    const email = await getUserEmail(tokens.access_token);

    const existing = readAccounts(service);
    const previous = existing.find((a) => a.email === email);
    // Gmail supports multiple accounts; YouTube / Search Console only keep one (new replaces the old one)
    const others = cfg.multi ? existing.filter((a) => a.email !== email) : [];

    const account: GoogleAccount = {
      email,
      access_token: tokens.access_token,
      // Google sometimes does not return a refresh_token on re-login, so preserve the existing one when available
      refresh_token: tokens.refresh_token || previous?.refresh_token || "",
      expiry: Date.now() + (tokens.expires_in || 3600) * 1000,
    };

    const res = NextResponse.redirect(new URL(cfg.returnTo, origin));
    writeAccounts(res, service, [...others, account]);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  } catch (err: any) {
    return fail(err?.message || "auth_failed");
  }
}
