import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock the redirect function (throws like the real one)
const mockRedirect = mock(() => {
  throw new Error("NEXT_REDIRECT");
});

mock.module("next/navigation", () => ({
  redirect: mockRedirect,
}));

mock.module("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

// Mock the Better Auth server instance
const mockSignOut = mock(() => Promise.resolve({ success: true }));
const mockSignInEmail = mock(() => Promise.resolve({ token: "token", user: { id: "123" } }));
const mockSignUpEmail = mock(() => Promise.resolve({ token: "token", user: { id: "123" } }));

mock.module("@/core/auth/server", () => ({
  auth: {
    api: {
      signOut: mockSignOut,
      signInEmail: mockSignInEmail,
      signUpEmail: mockSignUpEmail,
    },
  },
}));

// Import after mocking
const { signOut } = await import("./actions");
const { login } = await import("@/app/(auth)/login/actions");
const { register } = await import("@/app/(auth)/register/actions");

describe("signOut", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockRedirect.mockClear();
  });

  it("calls auth.api.signOut and redirects to login", async () => {
    try {
      await signOut();
    } catch {
      // redirect throws
    }

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});

describe("login", () => {
  beforeEach(() => {
    mockSignInEmail.mockClear();
    mockRedirect.mockClear();
  });

  it("returns error for invalid form data (missing email)", async () => {
    const formData = new FormData();
    formData.set("password", "password123");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid form data");
  });

  it("returns error for invalid form data (missing password)", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid form data");
  });

  it("returns error for empty email", async () => {
    const formData = new FormData();
    formData.set("email", "");
    formData.set("password", "password123");

    const result = await login({}, formData);

    expect(result.error).toBe("Email and password are required");
  });

  it("returns error for empty password", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "");

    const result = await login({}, formData);

    expect(result.error).toBe("Email and password are required");
  });

  it("calls signInEmail with credentials", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");

    try {
      await login({}, formData);
    } catch {
      // redirect throws
    }

    expect(mockSignInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "test@example.com", password: "password123" },
      }),
    );
  });

  it("returns error when sign-in fails", async () => {
    mockSignInEmail.mockImplementationOnce((() =>
      Promise.reject(new Error("Invalid email or password"))) as never);

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "wrongpassword");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid email or password");
  });
});

describe("register", () => {
  beforeEach(() => {
    mockSignUpEmail.mockClear();
    mockRedirect.mockClear();
  });

  it("returns error for invalid form data (missing email)", async () => {
    const formData = new FormData();
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    const result = await register({}, formData);

    expect(result.error).toBe("Invalid form data");
  });

  it("returns error for invalid form data (missing password)", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("confirmPassword", "password123");

    const result = await register({}, formData);

    expect(result.error).toBe("Invalid form data");
  });

  it("returns error for invalid form data (missing confirmPassword)", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");

    const result = await register({}, formData);

    expect(result.error).toBe("Invalid form data");
  });

  it("returns error for empty fields", async () => {
    const formData = new FormData();
    formData.set("email", "");
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    const result = await register({}, formData);

    expect(result.error).toBe("All fields are required");
  });

  it("returns error when passwords do not match", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");
    formData.set("confirmPassword", "different");

    const result = await register({}, formData);

    expect(result.error).toBe("Passwords do not match");
  });

  it("returns error when password is too short", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "1234567");
    formData.set("confirmPassword", "1234567");

    const result = await register({}, formData);

    expect(result.error).toBe("Password must be at least 8 characters");
  });

  it("calls signUpEmail with credentials", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    try {
      await register({}, formData);
    } catch {
      // redirect throws
    }

    expect(mockSignUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          email: "test@example.com",
          password: "password123",
        }),
      }),
    );
  });

  it("returns error when signUp fails", async () => {
    mockSignUpEmail.mockImplementationOnce((() =>
      Promise.reject(new Error("User already exists"))) as never);

    const formData = new FormData();
    formData.set("email", "existing@example.com");
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    const result = await register({}, formData);

    expect(result.error).toBe("User already exists");
  });
});
