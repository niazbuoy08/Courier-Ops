"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClientError, listPackages } from "@/lib/api-client";
import { useSessionGuard } from "@/hooks/use-session-guard";
import type {
  Paginated,
  PackageStatus,
  PackageSummary,
  SortOrder,
} from "@/types/package";

export interface PackagesQuery {
  search: string;
  status?: PackageStatus;
  exception: boolean;
  overdue: boolean;
  sort: SortOrder;
  page: number;
  pageSize: number;
  /** When true, forces the request to fail (demo of the error state). */
  simulateFailure?: boolean;
}

export type PackagesFetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: Paginated<PackageSummary> };

type Result =
  | { key: null }
  | { key: string; data: Paginated<PackageSummary> }
  | { key: string; error: string };

/**
 * Fetches the package list for the given query. Re-runs whenever the query
 * changes, cancels the in-flight request on change/unmount, and exposes a
 * `retry()` for the error state's button.
 *
 * Loading is *derived* (the stored result's key not matching the current query)
 * rather than set imperatively, which keeps the effect free of synchronous
 * state updates.
 */
export function usePackages(query: PackagesQuery) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ key: null });
  const guard = useSessionGuard();

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const {
    search,
    status,
    exception,
    overdue,
    sort,
    page,
    pageSize,
    simulateFailure,
  } = query;

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        search,
        status,
        exception,
        overdue,
        sort,
        page,
        pageSize,
        simulateFailure,
        attempt,
      }),
    [
      search,
      status,
      exception,
      overdue,
      sort,
      page,
      pageSize,
      simulateFailure,
      attempt,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();

    listPackages(
      {
        search,
        status,
        exception,
        overdue,
        sort,
        page,
        pageSize,
        fail: simulateFailure,
      },
      controller.signal,
    )
      .then((data) => setResult({ key: queryKey, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (guard(error)) return;
        const message =
          error instanceof ApiClientError
            ? error.message
            : "We couldn't load the package list. Please try again.";
        setResult({ key: queryKey, error: message });
      });

    return () => controller.abort();
  }, [
    queryKey,
    guard,
    search,
    status,
    exception,
    overdue,
    sort,
    page,
    pageSize,
    simulateFailure,
  ]);

  const state: PackagesFetchState =
    result.key !== queryKey
      ? { status: "loading" }
      : "error" in result
        ? { status: "error", message: result.error }
        : { status: "success", data: result.data };

  return { state, retry };
}
