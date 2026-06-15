import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/core/config/env";
import { db } from "@/core/database";
import { account, session, user, verification } from "@/core/database/auth-schema";

/**
 * Better Auth server instance (email + password).
 *
 * Users, sessions, and accounts live in our own Railway Postgres via the Drizzle
 * adapter — no external auth provider. Import `auth` in server components, server
 * actions, route handlers, and the migrator-free runtime.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  // MUST be last: lets Next.js server actions set the session cookie.
  plugins: [nextCookies()],
});
