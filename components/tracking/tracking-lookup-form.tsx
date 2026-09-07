"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TRACKING_ID_PATTERN,
  normalizeTrackingId,
} from "@/lib/public-tracking";

export function TrackingLookupForm({
  initialValue = "",
}: {
  initialValue?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const id = normalizeTrackingId(value);
    if (!TRACKING_ID_PATTERN.test(id)) {
      setError("Enter a tracking number like CX123456789.");
      return;
    }
    router.push(`/track/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <label htmlFor="tracking" className="text-sm font-medium">
        Tracking number
      </label>
      <div className="flex gap-2">
        <Input
          id="tracking"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="CX123456789"
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "tracking-error" : undefined}
        />
        <Button type="submit">Track</Button>
      </div>
      {error ? (
        <p
          id="tracking-error"
          role="alert"
          className="text-destructive text-xs"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
