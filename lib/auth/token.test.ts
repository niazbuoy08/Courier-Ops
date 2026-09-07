import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken, verifySessionToken } from "./token";
import type { SessionUser } from "@/types/user";

const SECRET = "test-secret-not-used-in-production-0000000000000";
const user: SessionUser = {
  id: "507f1f77bcf86cd799439011",
  email: "dana@courier.dev",
  name: "Dana Dispatcher",
  role: "dispatcher",
};

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", SECRET);
});

describe("session token round-trip", () => {
  it("verifies a token it just signed and returns the user", async () => {
    const token = await signSessionToken(user);
    expect(await verifySessionToken(token)).toEqual(user);
  });

  it("returns null for a tampered token", async () => {
    const token = await signSessionToken(user);
    const tampered = token.slice(0, -3) + "aaa";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("returns null when the token was signed with a different secret", async () => {
    const foreign = await new SignJWT({
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(
        new TextEncoder().encode("a-totally-different-secret-value-000000"),
      );

    expect(await verifySessionToken(foreign)).toBeNull();
  });

  it("returns null when a claim is missing or the role is invalid", async () => {
    const noRole = await new SignJWT({ email: user.email, name: user.name })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(noRole)).toBeNull();

    const badRole = await new SignJWT({
      email: user.email,
      name: user.name,
      role: "superadmin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(badRole)).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const expired = await new SignJWT({
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt(0)
      .setExpirationTime(60) // 1970-01-01T00:01:00Z — long past
      .sign(new TextEncoder().encode(SECRET));

    expect(await verifySessionToken(expired)).toBeNull();
  });
});
