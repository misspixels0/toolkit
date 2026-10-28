import { NextRequest, NextResponse } from "next/server";
import { readAccount, getFreshAccessToken } from "@/lib/google";

export const maxDuration = 300; // video uploads can take a while

export async function POST(req: NextRequest) {
  const account = readAccount("youtube");
  if (!account) {
    return NextResponse.json({ error: "No YouTube account connected" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("video") as File | null;
  const title = (formData.get("title") as string) || "Untitled";
  const description = (formData.get("description") as string) || "";

  if (!file) return NextResponse.json({ error: "A video file is required" }, { status: 400 });

  try {
    const accessToken = await getFreshAccessToken(account);
    const metadata = {
      snippet: { title, description, categoryId: "22" },
      status: { privacyStatus: "private" }, // change to "public" when ready
    };

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": file.type || "video/mp4",
          "X-Upload-Content-Length": String(file.size),
        },
        body: JSON.stringify(metadata),
      }
    );
    if (!initRes.ok) throw new Error(await initRes.text());

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) throw new Error("Could not start resumable upload session");

    const bytes = Buffer.from(await file.arrayBuffer());
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "video/mp4",
        "Content-Length": String(bytes.length),
      },
      body: bytes,
    });

    if (!uploadRes.ok) throw new Error(await uploadRes.text());
    const result = await uploadRes.json();

    return NextResponse.json({ videoId: result.id, url: `https://youtu.be/${result.id}` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
