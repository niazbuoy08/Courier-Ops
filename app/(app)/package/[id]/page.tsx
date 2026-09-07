import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PackageDetailView } from "@/components/packages/package-detail-view";
import { getSession } from "@/lib/auth/session";
import { canWrite } from "@/types/user";

export const metadata: Metadata = {
  title: "Package details",
};

export default async function PackageDetailPage({
  params,
  searchParams,
}: PageProps<"/package/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const session = await getSession();

  return (
    <div className="space-y-6">
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

      <PackageDetailView
        id={id}
        canWrite={canWrite(session?.role)}
        justCreated={created === "1"}
      />
    </div>
  );
}
