import type { ReactNode } from "react";

/** Label + control + inline error, shared by the create and edit package forms. */
export function FormField({
  id,
  label,
  hint,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium"
      >
        {label}
        {hint ? (
          <span className="text-muted-foreground text-xs font-normal">
            {hint}
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
