// /lib/accountCredentials.ts
//
// Permanent email/password account storage (AlumniCredential table).
// Pairs with lib/passwordHash.ts (hashing) and lib/emailLoginCodes.ts
// (proves email ownership before a password can be set/reset).
import "server-only";
import { prisma } from "@/lib/prisma";
import { normalizeEmailIdentity } from "@/lib/emailIdentity";

export async function getCredential(rawEmail: string) {
  const email = normalizeEmailIdentity(rawEmail);
  if (!email) return null;
  return prisma.alumniCredential.findUnique({ where: { email } });
}

/** Create or replace the password hash for an email. */
export async function upsertCredential(rawEmail: string, passwordHash: string) {
  const email = normalizeEmailIdentity(rawEmail);
  if (!email) throw new Error("upsertCredential: email required");

  return prisma.alumniCredential.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });
}
