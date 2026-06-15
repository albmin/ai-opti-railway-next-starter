"use client";

import { useSession } from "@/core/auth/client";

/**
 * Hook to read the current user in client components.
 * Returns `null` while loading, `undefined` if not authenticated, or the user.
 */
export function useUser() {
  const { data, isPending } = useSession();

  const user = isPending ? null : (data?.user ?? undefined);

  return {
    user,
    isLoading: isPending,
    isAuthenticated: !isPending && Boolean(data?.user),
  };
}
