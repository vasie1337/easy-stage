import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const adminEmail = process.env.AUTH_ADMIN_EMAIL;
const adminPassword = process.env.AUTH_ADMIN_PASSWORD;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        if (!adminEmail || !adminPassword) {
          return null;
        }
        if (
          credentials.email !== adminEmail ||
          credentials.password !== adminPassword
        ) {
          return null;
        }
        return { id: "admin", email: adminEmail };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
};
