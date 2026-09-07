"use client";

import Link from "next/link";
import { usePackage } from "@/hooks/use-package";
import { isEditableStatus } from "@/types/package";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PackageDetailSkeleton } from "@/components/packages/package-detail-skeleton";
import { EditPackageForm } from "@/components/packages/edit-package-form";

/** Loads the package and, if it's still editable, renders the edit form. */
export function EditPackageView({ id }: { id: string }) {
  const { state, refresh } = usePackage(id);

  if (state.status === "loading") return <PackageDetailSkeleton />;

  if (state.status === "not-found") {
    return (
      <EmptyState
        title="Package not found"
        description={`We couldn't find a package matching “${id}”.`}
        action={
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to all packages
          </Link>
        }
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="We couldn't load this package"
        message={state.message}
        onRetry={refresh}
      />
    );
  }

  const pkg = state.data;

  if (!isEditableStatus(pkg.status)) {
    return (
      <EmptyState
        title="This package can no longer be edited"
        description={`${pkg.trackingId} is “${pkg.status}”. Shipment details are locked once a package leaves the origin.`}
        action={
          <Link
            href={`/package/${pkg.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to package
          </Link>
        }
      />
    );
  }

  return <EditPackageForm pkg={pkg} />;
}
