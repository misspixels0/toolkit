import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl, isService, OAUTH_STATE_COOKIE, SERVICE_CONFIG } from "@/lib/google";

// Usage: /api/auth/google?service=gmail | youtube | gsc
export async function GET(req: NextRequest) {
  const service = req.nextUrl.searchParams.get("service");
  if (!isService(service)) {
    return NextResponse.json({ error: "service must be gmail, youtube or gsc" }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  const back = SERVICE_CONFIG[service].returnTo;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const msg = "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set (check .env.local)";
    return NextResponse.redirect(new URL(`${back}?error=${encodeURIComponent(msg)}`, origin));
  }

  const state = `${service}.${crypto.randomUUID()}`;
  const res = NextResponse.redirect(buildAuthUrl(service, state, origin));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
