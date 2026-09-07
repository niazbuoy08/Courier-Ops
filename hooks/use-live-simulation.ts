"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addStatusEvent, ApiClientError } from "@/lib/api-client";
import { useSessionGuard } from "@/hooks/use-session-guard";
import { simulatedLocation } from "@/lib/simulation";
import { nextStatusInFlow, type PackageStatus } from "@/types/package";

const MIN_INTERVAL_MS = 5000;
const MAX_INTERVAL_MS = 8000;

const nextDelay = () =>
  MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);

export type SimulationPhase = "idle" | "running" | "completed" | "error";

export interface UseLiveSimulationOptions {
  packageId: string;
  currentStatus: PackageStatus;
  receiverAddress: string;
  /** Called after each successful update so the page can re-fetch. */
  onAdvanced: () => void;
}

/**
 * Drives the Live Tracking Simulation. Each step — whether from the running
 * timer or the manual "Advance one step" button — sends a real
 * `PATCH /api/packages/[id]/status`, so MongoDB is genuinely updated and the
 * page re-fetches. Not a UI-only animation.
 *
 * The effect re-runs whenever `currentStatus` changes (after each successful
 * advance from the re-fetch), scheduling the next tick — so there is no
 * long-lived interval to keep in sync.
 */
export function useLiveSimulation({
  packageId,
  currentStatus,
  receiverAddress,
  onAdvanced,
}: UseLiveSimulationOptions) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const guard = useSessionGuard();

  const inFlight = useRef(false);

  const nextStatus = nextStatusInFlow(currentStatus);

  const start = useCallback(() => {
    setError(null);
    setRunning(true);
  }, []);

  const stop = useCallback(() => setRunning(false), []);

  const advance = useCallback(
    async (target: PackageStatus) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setPending(true);
      try {
        await addStatusEvent(packageId, {
          status: target,
          location: simulatedLocation(target, receiverAddress),
        });
        setError(null);
        setLastMessage(`Package status updated to “${target}”.`);
        onAdvanced();
      } catch (requestError) {
        if (guard(requestError)) return;
        if (
          requestError instanceof ApiClientError &&
          requestError.status === 409
        ) {
          // The package moved on somewhere else — just re-sync and carry on.
          setLastMessage(null);
          onAdvanced();
          return;
        }
        setError(
          requestError instanceof ApiClientError
            ? requestError.message
            : "The update didn't go through. Please try again.",
        );
        setRunning(false);
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [packageId, receiverAddress, onAdvanced, guard],
  );

  const advanceOnce = useCallback(() => {
    if (nextStatus) void advance(nextStatus);
  }, [advance, nextStatus]);

  useEffect(() => {
    if (!running || error !== null || nextStatus === null) return;

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) void advance(nextStatus);
    }, nextDelay());

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [running, error, nextStatus, advance]);

  const phase: SimulationPhase =
    error !== null
      ? "error"
      : nextStatus === null
        ? "completed"
        : running
          ? "running"
          : "idle";

  return {
    phase,
    error,
    running,
    pending,
    nextStatus,
    lastMessage,
    start,
    stop,
    advanceOnce,
  };
}
