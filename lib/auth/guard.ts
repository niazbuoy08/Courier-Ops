import { getSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/api-helpers";
import { canWrite, type SessionUser } from "@/types/user";

export type GuardResult =
  { ok: true; user: SessionUser } | { ok: false; response: Response };

/** Route-handler guard: any signed-in user. */
export async function requireUser(): Promise<GuardResult> {
  const user = await getSession();
  if (!user) {
    return {
      ok: false,
      response: jsonError(
        401,
        "Your session has expired. Please sign in again.",
      ),
    };
  }
  return { ok: true, user };
}

/** Route-handler guard: signed in AND allowed to write (dispatcher). */
export async function requireWriter(): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (!canWrite(result.user.role)) {
    return {
      ok: false,
      response: jsonError(
        403,
        "You need the Dispatcher role to make this change.",
      ),
    };
  }
  return result;
}
