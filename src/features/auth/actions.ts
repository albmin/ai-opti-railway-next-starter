"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/core/auth/server";
import { getLogger } from "@/core/logging";

const logger = getLogger("auth.actions");

/**
 * Sign out the current user and redirect to login.
 */
export async function signOut(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
    logger.info("auth.signout_completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message }, "auth.signout_error");
  }

  redirect("/login");
}
