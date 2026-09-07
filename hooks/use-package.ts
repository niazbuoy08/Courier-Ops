"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClientError, getPackage } from "@/lib/api-client";
import { useSessionGuard } from "@/hooks/use-session-guard";
import type { Package } from "@/types/package";

export type PackageFetchState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "success"; data: Package };

interface Snapshot {
  key: string;
  data: Package | null;
  error: string | null;
  notFound: boolean;
}

/**
 * Fetches a single package by id (or tracking ID).
 *
 *  - Separates 404 (`not-found`) from other failures.
 *  - `refresh()` re-runs the request. While a refresh is in flight the previous
 *    data keeps rendering (stale-while-revalidate) so the live simulation on the
 *    detail page isn't torn down on every tick.
 */
export function usePackage(id: string) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const guard = useSessionGuard();

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);

  const queryKey = useMemo(() => `${id}#${attempt}`, [id, attempt]);

  useEffect(() => {
    const controller = new AbortController();

    getPackage(id, { signal: controller.signal })
      .then((data) =>
        setSnapshot({ key: queryKey, data, error: null, notFound: false }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (guard(error)) return;
        if (error instanceof ApiClientError && error.status === 404) {
          setSnapshot({
            key: queryKey,
            data: null,
            error: null,
            notFound: true,
          });
          return;
        }
        setSnapshot({
          key: queryKey,
          data: null,
          notFound: false,
          error:
            error instanceof ApiClientError
              ? error.message
              : "We couldn't load this package. Please try again.",
        });
      });

    return () => controller.abort();
  }, [queryKey, id, guard]);

  const isRevalidating = snapshot !== null && snapshot.key !== queryKey;

  let state: PackageFetchState;
  if (!snapshot) {
    state = { status: "loading" };
  } else if (snapshot.notFound) {
    state = { status: "not-found" };
  } else if (snapshot.error !== null) {
    state = { status: "error", message: snapshot.error };
  } else if (snapshot.data) {
    state = { status: "success", data: snapshot.data };
  } else {
    state = { status: "loading" };
  }

  return { state, refresh, isRevalidating };
}
