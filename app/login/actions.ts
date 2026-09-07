"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserByEmail } from "@/lib/users";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  callbackUrl: z.string().optional(),
});

export interface LoginState {
  error?: string;
}

/** Only allow same-origin relative paths as post-login redirect targets. */
function safeRedirect(target: string | undefined): string {
  if (target && target.startsWith("/") && !target.startsWith("//"))
    return target;
  return "/";
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password, callbackUrl } = parsed.data;

  const user = await getUserByEmail(email);
  // Always run a comparison to keep timing roughly constant whether or not the
  // account exists.
  const passwordOk = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(
        password,
        "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva",
      );

  if (!user || !passwordOk) {
    return { error: "Incorrect email or password." };
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect(safeRedirect(callbackUrl));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
