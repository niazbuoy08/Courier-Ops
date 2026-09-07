import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CreatePackageForm } from "@/components/packages/create-package-form";
import { getSession } from "@/lib/auth/session";
import { canWrite } from "@/types/user";

export const metadata: Metadata = {
  title: "New package",
};

export default async function NewPackagePage() {
  const session = await getSession();
  if (!canWrite(session?.role)) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2.5",
        })}
      >
        <ArrowLeft aria-hidden />
        Back to packages
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create a package
        </h1>
        <p className="text-muted-foreground text-sm">
          Add a new shipment to the dashboard.
        </p>
      </div>

      <CreatePackageForm />
    </div>
  );
}
