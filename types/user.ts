export const USER_ROLES = ["viewer", "dispatcher"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** The user shape carried in the session cookie and exposed to the app. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

/** `dispatcher` may create packages and push status events; `viewer` is read-only. */
export function canWrite(role: UserRole | undefined | null): boolean {
  return role === "dispatcher";
}
