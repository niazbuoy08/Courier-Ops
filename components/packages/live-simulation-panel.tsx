"use client";

import { ChevronRight, Lock, Play, RadioTower, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveSimulation } from "@/hooks/use-live-simulation";
import type { Package } from "@/types/package";

export function LiveSimulationPanel({
  pkg,
  onAdvanced,
  canWrite,
}: {
  pkg: Package;
  onAdvanced: () => void;
  canWrite: boolean;
}) {
  const {
    phase,
    error,
    running,
    pending,
    nextStatus,
    lastMessage,
    start,
    stop,
    advanceOnce,
  } = useLiveSimulation({
    packageId: pkg.id,
    currentStatus: pkg.status,
    receiverAddress: pkg.receiverAddress,
    onAdvanced,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="size-4" aria-hidden />
          Live Tracking Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          This creates real tracking events and moves the package forward one
          step at a time. Every change is saved and the history updates.
        </p>

        {!canWrite ? (
          <p className="text-muted-foreground flex items-start gap-2">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            Signed in as a Viewer. Package status updates require the Dispatcher
            role.
          </p>
        ) : phase === "completed" ? (
          <p>This package has been delivered. Nothing left to simulate.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {running ? (
                <Button size="sm" variant="outline" onClick={stop}>
                  <Square aria-hidden />
                  Stop simulation
                </Button>
              ) : (
                <Button size="sm" onClick={start} disabled={pending}>
                  <Play aria-hidden />
                  Start simulation
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={advanceOnce}
                disabled={running || pending}
              >
                <ChevronRight aria-hidden />
                Advance one step
              </Button>
            </div>

            <p className="text-muted-foreground text-xs" aria-live="polite">
              {running ? (
                <>
                  <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-emerald-500 align-middle" />
                  Next update in a few seconds — moving to &ldquo;{nextStatus}
                  &rdquo;.
                </>
              ) : (
                <>Next step: {nextStatus}</>
              )}
            </p>
          </>
        )}

        {canWrite && lastMessage && phase !== "error" ? (
          <p
            className="text-xs text-emerald-700 dark:text-emerald-400"
            role="status"
          >
            {lastMessage}
          </p>
        ) : null}

        {phase === "error" && error ? (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
