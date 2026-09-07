"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { usePackages } from "@/hooks/use-packages";
import { isPackageStatus } from "@/types/package";
import type { PackageStatus, SortOrder } from "@/types/package";
import { buttonVariants } from "@/components/ui/button";
import { PackagesSummary } from "@/components/packages/packages-summary";
import { PackagesToolbar } from "@/components/packages/packages-toolbar";
import { PackagesTable } from "@/components/packages/packages-table";
import { PackagesTableSkeleton } from "@/components/packages/packages-table-skeleton";
import { PackagesPagination } from "@/components/packages/packages-pagination";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";

const PAGE_SIZE = 10;

/** Serializable UI state lives in the URL so it survives refresh / back-forward. */
type ParamUpdates = Record<string, string | null>;

export function PackagesView({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status");
  const status = isPackageStatus(statusParam) ? statusParam : undefined;
  const exception = searchParams.get("attention") === "1";
  const sort: SortOrder =
    searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const simulateFailure = searchParams.get("simulateFailure") === "1";

  const setParams = useCallback(
    (updates: ParamUpdates) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const handleSearchChange = useCallback(
    (value: string) => setParams({ q: value || null, page: null }),
    [setParams],
  );
  const handleStatusChange = useCallback(
    (value?: PackageStatus) =>
      setParams({ status: value ?? null, attention: null, page: null }),
    [setParams],
  );
  const handleSortChange = useCallback(
    (value: SortOrder) =>
      setParams({ sort: value === "newest" ? null : value, page: null }),
    [setParams],
  );
  const handlePageChange = useCallback(
    (nextPage: number) =>
      setParams({ page: nextPage <= 1 ? null : String(nextPage) }),
    [setParams],
  );
  const handleExceptionChange = useCallback(
    (on: boolean) =>
      setParams({ attention: on ? "1" : null, status: null, page: null }),
    [setParams],
  );
  const toggleSimulateFailure = useCallback(
    (checked: boolean) => setParams({ simulateFailure: checked ? "1" : null }),
    [setParams],
  );

  const { state, retry } = usePackages({
    search,
    status,
    exception,
    sort,
    page,
    pageSize: PAGE_SIZE,
    simulateFailure,
  });

  const hasActiveFilters = search !== "" || status !== undefined || exception;
  const total = state.status === "success" ? state.data.total : 0;

  return (
    <div className="space-y-4" aria-busy={state.status === "loading"}>
      <PackagesSummary
        refreshSignal={total}
        activeStatus={status}
        activeException={exception}
        onStatusSelect={handleStatusChange}
        onExceptionSelect={handleExceptionChange}
      />

      <PackagesToolbar
        search={search}
        status={status}
        sort={sort}
        exceptionsOnly={exception}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
        onExceptionsOnlyChange={handleExceptionChange}
      />

      <label className="text-muted-foreground flex w-fit items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="accent-primary focus-visible:ring-ring size-3.5 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          checked={simulateFailure}
          onChange={(event) => toggleSimulateFailure(event.target.checked)}
        />
        Simulate a failed request (demo)
      </label>

      <p className="sr-only" role="status">
        {state.status === "loading"
          ? "Loading packages…"
          : state.status === "success"
            ? `${state.data.total} package${state.data.total === 1 ? "" : "s"} found`
            : ""}
      </p>

      {state.status === "loading" ? (
        <PackagesTableSkeleton rows={PAGE_SIZE} />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          title="We couldn't load the package list"
          message={state.message}
          onRetry={retry}
        />
      ) : null}

      {state.status === "success" && state.data.data.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters
              ? "No packages match your filters"
              : "No packages yet"
          }
          description={
            hasActiveFilters
              ? "Try a different search term or clear the filters."
              : "Packages you add will show up here."
          }
          action={
            !hasActiveFilters && canCreate ? (
              <Link
                href="/package/new"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Plus aria-hidden />
                Create the first package
              </Link>
            ) : null
          }
        />
      ) : null}

      {state.status === "success" && state.data.data.length > 0 ? (
        <>
          <PackagesTable packages={state.data.data} />
          <PackagesPagination
            page={state.data.page}
            totalPages={state.data.totalPages}
            total={state.data.total}
            pageSize={state.data.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </div>
  );
}
