import { NextResponse } from "next/server";
import { readAccount, getFreshAccessToken } from "@/lib/google";

export async function GET() {
  const account = readAccount("gsc");
  if (!account) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  try {
    const accessToken = await getFreshAccessToken(account);
    const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return NextResponse.json({ sites: data.siteEntry || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to list sites" }, { status: 500 });
  }
}
