import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/core/auth/server";

/**
 * Better Auth catch-all handler — serves all `/api/auth/*` endpoints
 * (sign-in, sign-up, sign-out, session, etc.).
 */
export const { POST, GET } = toNextJsHandler(auth);
