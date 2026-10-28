import { NextRequest, NextResponse } from "next/server";
import { readAccount, getFreshAccessToken } from "@/lib/google";

export async function POST(req: NextRequest) {
  const account = readAccount("gsc");
  if (!account) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const { siteUrl, inspectionUrl } = await req.json();
  if (!siteUrl || !inspectionUrl) {
    return NextResponse.json({ error: "siteUrl and inspectionUrl are required" }, { status: 400 });
  }

  try {
    const accessToken = await getFreshAccessToken(account);
    const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inspectionUrl, siteUrl }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return NextResponse.json(data.inspectionResult || {});
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Inspection failed" }, { status: 500 });
  }
}
