import { Schema, model, models, type Model } from "mongoose";
import { USER_ROLES, type UserRole } from "@/types/user";

export interface UserDoc {
  email: string;
  name: string;
  /** bcrypt hash — never returned to the client. */
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "viewer",
    },
  },
  { timestamps: true },
);

export const UserModel: Model<UserDoc> =
  (models.User as Model<UserDoc> | undefined) ??
  model<UserDoc>("User", UserSchema);
