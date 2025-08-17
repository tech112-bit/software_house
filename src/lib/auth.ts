import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import bcrypt from 'bcrypt';
import type { NextAuthConfig } from 'next-auth';

// Define providers array
const providers = [];

// Add Credentials provider
providers.push(
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (user && user.password && (await bcrypt.compare(credentials.password as string, user.password))) {
        return user;
      }

      return null;
    },
  })
);

// Add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Add Facebook provider if credentials are available
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    })
  );
}

const config: NextAuthConfig = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔐 AUTH: JWT callback - user:', user);
      console.log('🔐 AUTH: JWT callback - token before:', token);
      
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        console.log('🔐 AUTH: JWT callback - setting token role to:', (user as any).role);
      }
      
      console.log('🔐 AUTH: JWT callback - token after:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('🔐 AUTH: Session callback - token:', token);
      console.log('🔐 AUTH: Session callback - session before:', session);
      
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        console.log('🔐 AUTH: Session callback - setting session role to:', token.role);
      }
      
      console.log('🔐 AUTH: Session callback - session after:', session);
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);