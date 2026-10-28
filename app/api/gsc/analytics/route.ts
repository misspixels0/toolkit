import { NextRequest, NextResponse } from "next/server";
import { readAccount, getFreshAccessToken } from "@/lib/google";

export async function POST(req: NextRequest) {
  const account = readAccount("gsc");
  if (!account) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const { siteUrl, startDate, endDate, dimension } = await req.json();
  if (!siteUrl) return NextResponse.json({ error: "siteUrl is required" }, { status: 400 });

  try {
    const accessToken = await getFreshAccessToken(account);
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate || daysAgo(28),
          endDate: endDate || daysAgo(1),
          dimensions: [dimension || "query"],
          rowLimit: 25,
        }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return NextResponse.json({ rows: data.rows || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch analytics" }, { status: 500 });
  }
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
