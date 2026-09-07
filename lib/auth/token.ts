import { SignJWT, jwtVerify } from "jose";
import { isUserRole, type SessionUser } from "@/types/user";

export const SESSION_COOKIE_NAME = "courier_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Pure sign/verify helpers with no `next/headers` dependency, so this module is
 * safe to import from `proxy.ts` as well as from server components.
 */

function getSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not set. Add it to .env.local.");
  }
  return new TextEncoder().encode(value);
}

export function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { sub, email, name, role } = payload;
    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      !isUserRole(role)
    ) {
      return null;
    }
    return { id: sub, email, name, role };
  } catch {
    return null;
  }
}
