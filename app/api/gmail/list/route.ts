import { NextRequest, NextResponse } from "next/server";
import { readAccounts, getFreshAccessToken } from "@/lib/google";

function decodeHeader(headers: any[], name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const account = readAccounts("gmail").find((a) => a.email === email);
  if (!account) return NextResponse.json({ error: "Account not connected" }, { status: 404 });

  try {
    const accessToken = await getFreshAccessToken(account);

    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&labelIds=INBOX",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listRes.ok) throw new Error(await listRes.text());
    const listData = await listRes.json();
    const ids: string[] = (listData.messages || []).map((m: any) => m.id);

    const messages = await Promise.all(
      ids.map(async (id) => {
        const r = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const d = await r.json();
        const headers = d.payload?.headers || [];
        return {
          id,
          from: decodeHeader(headers, "From"),
          subject: decodeHeader(headers, "Subject") || "(no subject)",
          date: decodeHeader(headers, "Date"),
          snippet: d.snippet,
          unread: (d.labelIds || []).includes("UNREAD"),
        };
      })
    );

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch inbox" }, { status: 500 });
  }
}
