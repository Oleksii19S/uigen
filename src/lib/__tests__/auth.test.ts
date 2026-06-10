// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// Prevent "server-only" from throwing outside Next.js
vi.mock("server-only", () => ({}));

// Track cookie.set calls
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: mockCookieSet,
      get: vi.fn(),
      delete: vi.fn(),
    })
  ),
}));

// Import after mocks are set up
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    mockCookieSet.mockClear();
    vi.unstubAllEnvs();
  });

  test("sets an auth-token cookie", async () => {
    await createSession("u_01", "test@example.com");

    expect(mockCookieSet).toHaveBeenCalledOnce();
    const [name] = mockCookieSet.mock.calls[0];
    expect(name).toBe("auth-token");
  });

  test("cookie token is a valid signed JWT", async () => {
    await createSession("u_01", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload).toBeDefined();
  });

  test("JWT payload contains correct userId and email", async () => {
    await createSession("u_42", "alice@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("u_42");
    expect(payload.email).toBe("alice@example.com");
  });

  test("JWT expires in approximately 7 days", async () => {
    const before = Date.now();
    await createSession("u_01", "test@example.com");
    const after = Date.now();

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const expMs = (payload.exp as number) * 1000;
    expect(expMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("cookie is httpOnly with sameSite lax and path /", async () => {
    await createSession("u_01", "test@example.com");

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("secure flag is false outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await createSession("u_01", "test@example.com");

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.secure).toBe(false);
  });

  test("secure flag is true in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await createSession("u_01", "test@example.com");

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.secure).toBe(true);
  });

  test("cookie expires match the JWT expiry", async () => {
    await createSession("u_01", "test@example.com");

    const [, token, options] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const expMs = (payload.exp as number) * 1000;
    expect(options.expires.getTime()).toBeCloseTo(expMs, -4);
  });
});
