import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) {
    redirect("/");
  }

  const { callbackUrl, reason } = await searchParams;
  const notice =
    reason === "session-expired"
      ? "Your session has expired. Please sign in again."
      : undefined;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — hidden on small screens */}
      <aside className="bg-primary text-primary-foreground hidden flex-col p-10 lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Package className="size-6" aria-hidden />
          Courier Ops
        </div>

        <div className="flex flex-1 flex-col justify-center space-y-3">
          <p className="max-w-sm text-2xl leading-snug font-semibold">
            Track every shipment from pickup to doorstep.
          </p>
          <p className="text-primary-foreground/70 max-w-sm text-sm">
            Internal logistics dashboard — package status at a glance, a live
            tracking feed, and the full delivery history for every parcel.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight lg:hidden">
            <Package className="size-5" aria-hidden />
            Courier Ops
          </div>
          <LoginForm
            callbackUrl={
              typeof callbackUrl === "string" ? callbackUrl : undefined
            }
            notice={notice}
          />

          <p className="text-muted-foreground text-center text-sm">
            Just want to track a package?{" "}
            <Link
              href="/track"
              className="text-foreground font-medium underline underline-offset-4"
            >
              Track without signing in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
