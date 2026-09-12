import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { upsertSonoraUser } from '@/lib/sonora/auth-db';

export const googleOAuthConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  providers: googleOAuthConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.email) {
        const dbUser = await upsertSonoraUser({
          email: user.email,
          name: user.name,
          image: user.image,
          providerAccountId: account?.providerAccountId,
        });
        token.sonoraUserId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sonoraUserId || token.sub || '');
      }
      return session;
    },
  },
});
