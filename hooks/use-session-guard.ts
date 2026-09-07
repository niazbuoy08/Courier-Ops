"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api-client";

/**
 * Returns a function the data hooks call in their `catch`. If the error is a
 * 401 (session expired / signed out), it redirects to the login page with the
 * current path as `callbackUrl` and returns `true` so the caller can stop.
 */
export function useSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (error: unknown): boolean => {
      if (error instanceof ApiClientError && error.isSessionExpired) {
        const params = new URLSearchParams({
          callbackUrl: pathname,
          reason: "session-expired",
        });
        router.replace(`/login?${params.toString()}`);
        return true;
      }
      return false;
    },
    [router, pathname],
  );
}
