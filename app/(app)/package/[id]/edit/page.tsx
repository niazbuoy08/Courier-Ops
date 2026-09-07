import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EditPackageView } from "@/components/packages/edit-package-view";
import { getSession } from "@/lib/auth/session";
import { canWrite } from "@/types/user";

export const metadata: Metadata = {
  title: "Edit package",
};

export default async function EditPackagePage({
  params,
}: PageProps<"/package/[id]/edit">) {
  const { id } = await params;
  const session = await getSession();
  if (!canWrite(session?.role)) {
    redirect(`/package/${id}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href={`/package/${id}`}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2.5",
        })}
      >
        <ArrowLeft aria-hidden />
        Back to package
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit package</h1>
        <p className="text-muted-foreground text-sm">
          Update the shipment details before it leaves the origin.
        </p>
      </div>

      <EditPackageView id={id} />
    </div>
  );
}
