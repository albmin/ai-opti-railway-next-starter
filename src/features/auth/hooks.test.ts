import { describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const mockUser: SessionUser = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Controllable session state returned by the mocked useSession hook.
let sessionState: { data: { user: SessionUser } | null; isPending: boolean } = {
  data: null,
  isPending: true,
};

mock.module("@/core/auth/client", () => ({
  useSession: () => sessionState,
}));

const { useUser } = await import("./hooks");

describe("useUser", () => {
  it("returns loading state initially", () => {
    sessionState = { data: null, isPending: true };

    const { result } = renderHook(() => useUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("returns the user when authenticated", () => {
    sessionState = { data: { user: mockUser }, isPending: false };

    const { result } = renderHook(() => useUser());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("returns undefined user when not authenticated", () => {
    sessionState = { data: null, isPending: false };

    const { result } = renderHook(() => useUser());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
