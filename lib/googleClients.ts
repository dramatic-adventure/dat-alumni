// lib/googleClients.ts
import "server-only";
import { google, sheets_v4, drive_v3 } from "googleapis";

if (typeof window !== "undefined") {
  throw new Error("googleClients must only be imported on the server");
}

declare global {
  // eslint-disable-next-line no-var
  var __DAT_GOOGLE_JWT__: ReturnType<typeof getJWT> | undefined;
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function normalizePrivateKey(raw: string) {
  let k = String(raw || "");
  if (k.includes("\\n")) k = k.replace(/\\n/g, "\n");
  return k;
}

function decodeSaJsonFromEnv(): string {
  const raw = String(process.env.GCP_SA_JSON || "").trim();
  if (raw) return raw;

  const b64 = String(process.env.GCP_SA_JSON_BASE64 || "").trim();
  if (!b64) return "";

  // Base64 → UTF-8 JSON
  return Buffer.from(b64, "base64").toString("utf8").trim();
}

function getServiceAccount(): ServiceAccount {
  // 1) Preferred: split vars
  const client_email = String(process.env.GCP_SA_EMAIL || "").trim();
  const private_key = normalizePrivateKey(process.env.GCP_SA_PRIVATE_KEY || "");
  const project_id_raw = String(process.env.GCP_PROJECT_ID || "").trim();

  if (client_email && private_key) {
    return {
      client_email,
      private_key,
      project_id: project_id_raw || undefined,
    };
  }

  // 2) Fallback: JSON (raw or base64)
  const text = decodeSaJsonFromEnv();
  if (!text) {
    throw new Error(
      "Missing GCP_SA_EMAIL/GCP_SA_PRIVATE_KEY (or GCP_SA_JSON / GCP_SA_JSON_BASE64)"
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("GCP_SA_JSON is not valid JSON");
  }

  const jsonEmail = String(parsed.client_email || "").trim();
  const jsonKey = normalizePrivateKey(String(parsed.private_key || ""));
  const jsonProj = String(parsed.project_id || "").trim();

  if (!jsonEmail || !jsonKey) {
    throw new Error("GCP_SA_JSON missing client_email/private_key");
  }

  return {
    client_email: jsonEmail,
    private_key: jsonKey,
    project_id: jsonProj || undefined,
  };
}

function getJWT() {
  const { client_email, private_key } = getServiceAccount();

  return new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

function getAuth() {
  // Keep cache (fine). If you ever need, you can gate by NODE_ENV.
  if (!globalThis.__DAT_GOOGLE_JWT__) {
    globalThis.__DAT_GOOGLE_JWT__ = getJWT();
  }
  return globalThis.__DAT_GOOGLE_JWT__;
}

export function sheetsClient(): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function driveClient(): drive_v3.Drive {
  return google.drive({ version: "v3", auth: getAuth() });
}