"use client";

import { useId, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { ApiClientError, flagException } from "@/lib/api-client";
import { useSessionGuard } from "@/hooks/use-session-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/format";
import {
  PACKAGE_EXCEPTION_REASONS,
  type ExceptionReason,
  type Package,
} from "@/types/package";

export function ExceptionPanel({
  pkg,
  canWrite,
  onChange,
}: {
  pkg: Package;
  canWrite: boolean;
  onChange: () => void;
}) {
  const guard = useSessionGuard();
  const fieldId = useId();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ExceptionReason>(
    PACKAGE_EXCEPTION_REASONS[0],
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(nextReason: ExceptionReason | null) {
    setSubmitting(true);
    setError(null);
    try {
      await flagException(pkg.id, {
        reason: nextReason,
        ...(nextReason && note.trim() ? { note: note.trim() } : {}),
      });
      setOpen(false);
      setNote("");
      onChange();
    } catch (requestError) {
      if (guard(requestError)) return;
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "We couldn't update the exception. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (pkg.exception) {
    const { exception } = pkg;
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
      >
        <div className="flex items-start gap-3">
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Needs attention: {exception.reason}
            </p>
            {exception.note ? (
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
                {exception.note}
              </p>
            ) : null}
            <p className="text-xs text-amber-900/70 dark:text-amber-200/70">
              Flagged {formatRelativeTime(exception.flaggedAt)}
              {exception.flaggedBy ? ` by ${exception.flaggedBy.name}` : ""}
            </p>
            {canWrite ? (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => submit(null)}
                  disabled={submitting}
                >
                  {submitting ? "Clearing…" : "Clear exception"}
                </Button>
                {error ? (
                  <p role="alert" className="text-destructive mt-2 text-xs">
                    {error}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!canWrite) return null;

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-amber-700 dark:text-amber-400"
      >
        <TriangleAlert aria-hidden />
        Flag an exception
      </Button>
    );
  }

  return (
    <div className="border-border space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Flag an exception</p>

      <div className="space-y-1">
        <label htmlFor={`${fieldId}-reason`} className="text-sm font-medium">
          Reason
        </label>
        <Select
          value={reason}
          onValueChange={(value) => setReason(value as ExceptionReason)}
        >
          <SelectTrigger id={`${fieldId}-reason`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PACKAGE_EXCEPTION_REASONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${fieldId}-note`} className="text-sm font-medium">
          Note{" "}
          <span className="text-muted-foreground text-xs font-normal">
            Optional
          </span>
        </label>
        <Input
          id={`${fieldId}-note`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          autoComplete="off"
        />
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => submit(reason)} disabled={submitting}>
          {submitting ? "Saving…" : "Flag exception"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
