import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";

export const runtime = "nodejs"; // must be Node, not Edge

// Convert Node stream → Web ReadableStream
function toWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      // @ts-ignore
      nodeStream.destroy?.();
    },
  });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const fileId = params.id;
    const drive = driveClient();

    // Metadata for headers
    const meta = await drive.files.get({
      fileId,
      fields: "name,mimeType,size",
      supportsAllDrives: true,
    });
    const name = meta.data.name || "file";
    const mime = meta.data.mimeType || "application/octet-stream";
    const size = meta.data.size ? Number(meta.data.size) : undefined;

    // Stream content
    const r = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    const headers: Record<string, string> = {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(name)}"`,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    };
    if (!Number.isNaN(size!) && size !== undefined) headers["Content-Length"] = String(size);

    return new NextResponse(toWebStream(r.data as unknown as NodeJS.ReadableStream), { headers });
  } catch (e: any) {
    console.error("MEDIA PROXY ERROR:", e?.message || e);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
