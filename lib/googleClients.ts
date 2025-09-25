import { google, sheets_v4, drive_v3 } from "googleapis";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function getServiceAccount(): ServiceAccount {
  const raw = process.env.GCP_SA_JSON;
  if (!raw) throw new Error("GCP_SA_JSON is missing");
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { throw new Error("GCP_SA_JSON is not valid JSON"); }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GCP_SA_JSON missing client_email/private_key");
  }
  return parsed as ServiceAccount;
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

export function sheetsClient(): sheets_v4.Sheets {
  const auth = getJWT();
  return google.sheets({ version: "v4", auth });
}

export function driveClient(): drive_v3.Drive {
  const auth = getJWT();
  return google.drive({ version: "v3", auth });
}
