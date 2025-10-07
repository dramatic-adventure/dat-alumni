// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If a relative URL was provided (e.g. /alumni/update), keep it.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If it's same-origin, allow
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {}
      // ✅ default landing if no callbackUrl specified
      return `${baseUrl}/alumni/update`;
    },
  },
});

export { handler as GET, handler as POST };
