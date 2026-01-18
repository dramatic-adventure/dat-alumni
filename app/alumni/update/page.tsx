// app/alumni/update/page.tsx
import { getServerSession } from "next-auth";
import UpdateForm from "./update-form";

export const revalidate = 0;

function isAdminEmail(email?: string | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return !!(email && set.has(String(email).toLowerCase()));
}

export default async function UpdatePage() {
  const session = await getServerSession();

  if (!session) {
    const callback = encodeURIComponent("/alumni/update");
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1
          className="text-3xl font-bold mb-4"
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            textTransform: "uppercase",
          }}
        >
          Update Your Alumni Profile
        </h1>
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          }}
        >
          Please sign in with Google to continue.
        </p>

        {/* ✅ ensure we return to this page after Google auth */}
        <a
          href={`/api/auth/signin?callbackUrl=${callback}`}
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.35rem",
            fontSize: "1.1rem",
            color: "#f2f2f2",
            backgroundColor: "#6c00af",
            padding: "12px 30px",
            border: "none",
            borderRadius: "12px",
            display: "inline-block",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Sign In
        </a>
      </div>
    );
  }

  const email = (session.user?.email || "").toLowerCase();
  const isAdmin = isAdminEmail(email);

  // UpdateForm should accept: ({ email, isAdmin })
  return <UpdateForm email={email} isAdmin={isAdmin} />;
}
