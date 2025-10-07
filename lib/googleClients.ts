// lib/googleClients.ts
import "server-only";
import { google, sheets_v4, drive_v3 } from "googleapis";

/**
 * Prevent accidental client-side import (will surface fast in dev)
 */
if (typeof window !== "undefined") {
  throw new Error("googleClients must only be imported on the server");
}

/**
 * Cache auth client across HMR reloads in dev to avoid re-auth churn.
 * (globalThis is safe in Node)
 */
declare global {
  // eslint-disable-next-line no-var
  var __DAT_GOOGLE_JWT__: ReturnType<typeof getJWT> | undefined;
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function getServiceAccount(): ServiceAccount {
  const raw = process.env.GCP_SA_JSON;
  if (!raw) throw new Error("GCP_SA_JSON is missing");

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GCP_SA_JSON is not valid JSON");
  }

  const client_email = String(parsed.client_email || "").trim();
  let private_key = String(parsed.private_key || "");

  if (!client_email || !private_key) {
    throw new Error("GCP_SA_JSON missing client_email/private_key");
  }

  // Allow keys stored with literal "\n" sequences
  if (private_key.includes("\\n")) {
    private_key = private_key.replace(/\\n/g, "\n");
  }

  return { client_email, private_key, project_id: parsed.project_id };
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
  // Reuse the same JWT across hot reloads in dev
  if (!globalThis.__DAT_GOOGLE_JWT__) {
    globalThis.__DAT_GOOGLE_JWT__ = getJWT();
  }
  return globalThis.__DAT_GOOGLE_JWT__;
}

export function sheetsClient(): sheets_v4.Sheets {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

export function driveClient(): drive_v3.Drive {
  const auth = getAuth();
  return google.drive({ version: "v3", auth });
}
