import { getServerSession } from "next-auth";
import Link from "next/link";
import UpdateForm from "./update-form";

export const revalidate = 0;

export default async function UpdatePage() {
  const session = await getServerSession();
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>
          Update Your Alumni Profile
        </h1>
        <p className="mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Please sign in with Google to continue.
        </p>
        <a
          href="/api/auth/signin"
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
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

  return <UpdateForm email={(session.user?.email || "").toLowerCase()} />;
}
