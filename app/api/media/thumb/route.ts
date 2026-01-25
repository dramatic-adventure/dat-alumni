// app/api/media/thumb/route.ts
import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = String(searchParams.get("fileId") || "").trim();
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  const drive = driveClient();

  // Download the file bytes
  const r = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true } as any,
    { responseType: "arraybuffer" } as any
  );

  // Best-effort content type
  const contentType =
    (r.headers?.["content-type"] as string) ||
    (r.headers?.["Content-Type"] as string) ||
    "image/jpeg";

  return new NextResponse(r.data as any, {
    headers: {
      "Content-Type": contentType,
      // prevent “stale old headshot” issues
      "Cache-Control": "no-store",
    },
  });
}
