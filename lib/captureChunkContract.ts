// lib/captureChunkContract.ts
//
// Shared client/server contract for chunked capture uploads. Import-free on
// purpose: lib/captureSync (client bundle) and lib/captureStaging (server,
// pulls in @netlify/blobs) both need these numbers, and the client must never
// import the Blobs SDK.
//
// Next API routes on Netlify are Lambda-backed with a ~6 MB request-body
// ceiling. Blobs at or under DIRECT_MAX_BYTES go up in one multipart POST;
// anything larger is split into CHUNK_BYTES pieces, staged via
// /api/field-kit/capture/chunk, and reassembled at finalize.

/** Blobs strictly larger than this are chunked. */
export const DIRECT_MAX_BYTES = 3_500_000;
/** Size of each staged chunk (binary; multipart overhead stays under the Lambda limit). */
export const CHUNK_BYTES = 3_000_000;
/** ceil(25 MB server file cap / CHUNK_BYTES) — reject nonsense chunk counts early. */
export const MAX_CHUNKS = 9;
