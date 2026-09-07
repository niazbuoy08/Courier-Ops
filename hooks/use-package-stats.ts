"use client";

import { useEffect, useState } from "react";
import { ApiClientError, getPackageStats } from "@/lib/api-client";
import { useSessionGuard } from "@/hooks/use-session-guard";
import type { PackageStats } from "@/types/package";

export type StatsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: PackageStats };

/**
 * Loads the operational summary. `refreshSignal` — pass a value that changes
 * whenever the package list reloads (e.g. its total) so the counts stay in
 * sync after a create. A summary failure is non-blocking: the table still works.
 */
export function usePackageStats(refreshSignal: number) {
  const [state, setState] = useState<StatsState>({ status: "loading" });
  const guard = useSessionGuard();

  useEffect(() => {
    const controller = new AbortController();

    getPackageStats({ signal: controller.signal })
      .then((data) => setState({ status: "success", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (guard(error)) return;
        if (error instanceof ApiClientError || error instanceof Error) {
          setState({ status: "error" });
        }
      });

    return () => controller.abort();
  }, [refreshSignal, guard]);

  return state;
}
