import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PackagesView } from "@/components/packages/packages-view";
import { PackagesTableSkeleton } from "@/components/packages/packages-table-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { canWrite } from "@/types/user";

export default async function HomePage() {
  const session = await getSession();
  const canCreate = canWrite(session?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
          <p className="text-muted-foreground text-sm">
            See what&rsquo;s happening across every shipment, find a package,
            and open one for its full delivery journey.
          </p>
        </div>
        {canCreate ? (
          <Link href="/package/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Create package
          </Link>
        ) : null}
      </div>

      <Suspense fallback={<PackagesTableSkeleton />}>
        <PackagesView canCreate={canCreate} />
      </Suspense>
    </div>
  );
}
