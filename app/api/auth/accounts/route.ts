import { NextRequest, NextResponse } from "next/server";
import { isService, readAccounts, writeAccounts } from "@/lib/google";

// GET /api/auth/accounts?service=gmail  ->  { accounts: [{ email }] }
export async function GET(req: NextRequest) {
  const service = req.nextUrl.searchParams.get("service");
  if (!isService(service)) return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  return NextResponse.json({ accounts: readAccounts(service).map((a) => ({ email: a.email })) });
}

// DELETE body: { service, email? } -> if email is omitted, disconnect every account for this service
export async function DELETE(req: NextRequest) {
  const { service, email } = await req.json();
  if (!isService(service)) return NextResponse.json({ error: "Invalid service" }, { status: 400 });

  const remaining = email ? readAccounts(service).filter((a) => a.email !== email) : [];
  const res = NextResponse.json({ accounts: remaining.map((a) => ({ email: a.email })) });
  writeAccounts(res, service, remaining);
  return res;
}
