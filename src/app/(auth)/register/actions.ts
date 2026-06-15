"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/core/auth/server";

export interface RegisterState {
  error?: string;
}

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return { error: "Invalid form data" };
  }

  if (!email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        // Better Auth requires a name; derive a sensible default from the email.
        name: email.split("@")[0] ?? email,
      },
      headers: await headers(),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Something went wrong. Please try again.",
    };
  }

  redirect("/dashboard");
}
