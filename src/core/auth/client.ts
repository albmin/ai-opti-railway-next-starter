"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client. Same-origin by default, so no baseURL is needed.
 * Use in client components: `useSession()`, `signIn.email(...)`, `signOut()`.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
