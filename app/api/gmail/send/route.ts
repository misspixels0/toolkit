import { NextRequest, NextResponse } from "next/server";
import { readAccounts, getFreshAccessToken } from "@/lib/google";

// When the subject contains non-ASCII characters (e.g. Urdu, emoji), RFC 2047 encoding is required or Gmail may render it badly.
function encodeSubject(subject: string) {
  return /^[\x20-\x7E]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function buildRawEmail(from: string, to: string, subject: string, body: string) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(req: NextRequest) {
  const { fromEmail, to, subject, body } = await req.json();
  if (!fromEmail || !to || !subject || !body) {
    return NextResponse.json({ error: "to, subject, body and fromEmail are required" }, { status: 400 });
  }

  const account = readAccounts("gmail").find((a) => a.email === fromEmail);
  if (!account) return NextResponse.json({ error: "Sender account not connected" }, { status: 404 });

  try {
    const accessToken = await getFreshAccessToken(account);
    const raw = buildRawEmail(fromEmail, to, subject, body);

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) throw new Error(await res.text());

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to send email" }, { status: 500 });
  }
}
