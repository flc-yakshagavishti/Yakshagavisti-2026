import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { z } from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import { Role } from "@prisma/client";
import { verifyPassword } from "./password";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      LeaderOf:
        | {
            id: string;
            college_id: string;
            isComplete: boolean;
            editRequested: boolean;
          }
        | undefined;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,

      // Needed so users pre-created by email in the admin dashboard (admins/
      // judges with no linked Account yet) can link their Google identity on
      // first sign-in instead of hitting OAuthAccountNotLinked.
      allowDangerousEmailAccountLinking: true,
    }),
    // Username/password login for accounts seeded with a password (judges).
    CredentialsProvider({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = z
          .object({ username: z.string().min(1), password: z.string().min(1) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const login = parsed.data.username.trim().toLowerCase();
        const user = await db.user.findFirst({
          where: { OR: [{ username: login }, { email: login }] },
        });
        if (!user?.password) return null;
        if (!(await verifyPassword(parsed.data.password, user.password)))
          return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  // Credentials login requires JWT sessions; role is still read from the DB
  // on every session so role changes apply immediately.
  session: { strategy: "jwt" },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        const data = await db.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            LeaderOf: {
              select: {
                id: true,
                college_id: true,
                isComplete: true,
                editRequested: true,
              },
            },
          },
        });
        session.user.id = token.sub;
        session.user.role = data?.role ?? Role.PARTICIPANT;
        session.user.LeaderOf = data?.LeaderOf
          ? z
              .object({
                id: z.string(),
                college_id: z.string(),
                isComplete: z.boolean(),
                editRequested: z.boolean(),
              })
              .parse(data.LeaderOf)
          : undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
