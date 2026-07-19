// app/api/field-kit/capture/chunk/route.ts
//
// Stages ONE chunk of an oversized capture blob (voice, occasionally a photo
// that couldn't be compressed) into the dat-capture-staging Blobs store.
// Next API routes on Netlify are Lambda-backed with a ~6 MB body ceiling, so
// lib/captureSync splits big blobs into ~3 MB chunks, POSTs each here, then
// finalizes via /api/field-kit/capture with { stagedChunkCount, blobType }.
//
// Same trust model as the capture route: the roster gate runs HERE too (never
// trust the layout for a direct API hit). Chunk writes are idempotent — a
// retried chunk overwrites the same `<captureId>/<seq>` key, and captureId is
// a client-minted ULID so keys never collide across captures.

import { NextResponse } from "next/server";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { captureStagingStore, chunkKey, CHUNK_BYTES, MAX_CHUNKS } from "@/lib/captureStaging";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Higher ceiling than the capture route: one recording can be several
    // chunks, and retries after a dropped connection shouldn't rate-limit out.
    if (!rateLimit(rateKey(req), 120, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const form = await req.formData();
    const captureId = String(form.get("captureId") ?? "").trim();
    const seq = Number(form.get("seq"));
    const total = Number(form.get("total"));
    const asId = String(form.get("asId") ?? "").trim() || undefined;
    const chunk = form.get("chunk");

    if (!captureId) return NextResponse.json({ error: "captureId is required" }, { status: 400 });
    if (!Number.isInteger(seq) || !Number.isInteger(total) || seq < 0 || total < 1 || seq >= total || total > MAX_CHUNKS) {
      return NextResponse.json({ error: "Invalid chunk sequence" }, { status: 400 });
    }
    if (!(chunk instanceof File) || chunk.size === 0) {
      return NextResponse.json({ error: "chunk bytes are required" }, { status: 400 });
    }
    // Slop for the final (short) chunk aside, nothing should exceed CHUNK_BYTES.
    if (chunk.size > CHUNK_BYTES) {
      return NextResponse.json({ error: "Chunk too large" }, { status: 413 });
    }

    // Same gate the capture route uses. Signed-out → 401, not on roster → 403.
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }

    await captureStagingStore().set(chunkKey(captureId, seq), await chunk.arrayBuffer());
    return NextResponse.json({ ok: true, captureId, seq });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT CAPTURE CHUNK ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
