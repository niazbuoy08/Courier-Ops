import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/user";
import type { SessionUser } from "@/types/user";

interface RawUser {
  _id: { toString(): string };
  email: string;
  name: string;
  passwordHash: string;
  role: SessionUser["role"];
}

export interface UserWithHash extends SessionUser {
  passwordHash: string;
}

/** Looks up a user by email (case-insensitive). Includes the password hash, so
 *  this must only be used server-side during authentication. */
export async function getUserByEmail(
  email: string,
): Promise<UserWithHash | null> {
  await connectToDatabase();
  const user = await UserModel.findOne({
    email: email.toLowerCase().trim(),
  }).lean<RawUser | null>();

  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    passwordHash: user.passwordHash,
  };
}
