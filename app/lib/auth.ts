import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { SignJWT } from "jose";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4321";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      try {
        const res = await fetch(`${API_BASE}/api/auth/sync-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-sync-secret": process.env.NEXTAUTH_SECRET || "",
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: account.provider,
            provider_id: account.providerAccountId,
          }),
        });

        if (!res.ok) {
          console.error("[nextauth] Failed to sync user:", await res.text());
          return false;
        }

        const dbUser = await res.json();
        (user as any).dbId = dbUser.id;
        (user as any).credits = dbUser.credits;
      } catch (err) {
        console.error("[nextauth] Sync error:", err);
        return false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).dbId;
        token.credits = (user as any).credits;

        // Sign a JWT for the Express API (jose is compatible with jsonwebtoken.verify)
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
        token.accessToken = await new SignJWT({ userId: token.userId })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("30d")
          .sign(secret);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).userId = token.userId;
        (session.user as any).credits = token.credits;
      }
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
});
