"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, createPackage } from "@/lib/api-client";
import { useSessionGuard } from "@/hooks/use-session-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreatePackageBody, PackageStatus } from "@/types/package";

const INITIAL_STATUS_OPTIONS: PackageStatus[] = [
  "Pending",
  "Picked up",
  "In transit",
];

type FieldErrors = Partial<Record<keyof CreatePackageBody | "weight", string>>;

export function CreatePackageForm() {
  const router = useRouter();
  const guard = useSessionGuard();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [weight, setWeight] = useState("");
  const [status, setStatus] = useState<PackageStatus>("Pending");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldId = (name: string) => `${formId}-${name}`;
  const describedBy = (name: keyof FieldErrors) =>
    errors[name] ? fieldId(`${name}-error`) : undefined;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const local: FieldErrors = {};
    if (!sender.trim()) local.sender = "Sender name is required.";
    if (!receiver.trim()) local.receiver = "Receiver name is required.";
    if (!receiverAddress.trim())
      local.receiverAddress = "Delivery address is required.";
    const weightValue = Number(weight);
    if (!weight.trim() || Number.isNaN(weightValue) || weightValue <= 0) {
      local.weight = "Enter a weight greater than 0.";
    }
    if (Object.keys(local).length > 0) {
      setErrors(local);
      focusFirstError(local);
      return;
    }

    const body: CreatePackageBody = {
      sender: sender.trim(),
      receiver: receiver.trim(),
      receiverAddress: receiverAddress.trim(),
      ...(receiverPhone.trim() ? { receiverPhone: receiverPhone.trim() } : {}),
      weight: weightValue,
      status,
    };

    setSubmitting(true);
    try {
      const created = await createPackage(body);
      router.push(`/package/${created.id}?created=1`);
    } catch (error) {
      if (guard(error)) return;
      if (error instanceof ApiClientError && error.details) {
        const mapped: FieldErrors = {};
        for (const [key, messages] of Object.entries(error.details)) {
          mapped[key as keyof FieldErrors] = messages[0];
        }
        setErrors(mapped);
        focusFirstError(mapped);
      } else if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError("We couldn't create the package. Please try again.");
      }
      setSubmitting(false);
    }
  }

  function focusFirstError(current: FieldErrors) {
    const order: (keyof FieldErrors)[] = [
      "sender",
      "receiver",
      "receiverAddress",
      "receiverPhone",
      "weight",
    ];
    const first = order.find((name) => current[name]);
    if (first) {
      formRef.current
        ?.querySelector<HTMLElement>(`#${CSS.escape(fieldId(first))}`)
        ?.focus();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New package</CardTitle>
        <CardDescription>
          Register a package. A tracking ID and the opening tracking event are
          added automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          {formError ? (
            <p
              role="alert"
              className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
            >
              {formError}
            </p>
          ) : null}

          <Field
            id={fieldId("sender")}
            label="Sender name"
            error={errors.sender}
            errorId={fieldId("sender-error")}
          >
            <Input
              id={fieldId("sender")}
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              aria-invalid={Boolean(errors.sender)}
              aria-describedby={describedBy("sender")}
              autoComplete="off"
              required
              // Form-filler extensions mutate inputs before hydration.
              suppressHydrationWarning
            />
          </Field>

          <Field
            id={fieldId("receiver")}
            label="Receiver name"
            error={errors.receiver}
            errorId={fieldId("receiver-error")}
          >
            <Input
              id={fieldId("receiver")}
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              aria-invalid={Boolean(errors.receiver)}
              aria-describedby={describedBy("receiver")}
              autoComplete="off"
              required
              suppressHydrationWarning
            />
          </Field>

          <Field
            id={fieldId("receiverAddress")}
            label="Delivery address"
            error={errors.receiverAddress}
            errorId={fieldId("receiverAddress-error")}
          >
            <Input
              id={fieldId("receiverAddress")}
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              aria-invalid={Boolean(errors.receiverAddress)}
              aria-describedby={describedBy("receiverAddress")}
              autoComplete="off"
              required
              suppressHydrationWarning
            />
          </Field>

          <Field
            id={fieldId("receiverPhone")}
            label="Phone number"
            hint="Optional"
            error={errors.receiverPhone}
            errorId={fieldId("receiverPhone-error")}
          >
            <Input
              id={fieldId("receiverPhone")}
              type="tel"
              inputMode="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              aria-invalid={Boolean(errors.receiverPhone)}
              aria-describedby={describedBy("receiverPhone")}
              autoComplete="off"
              suppressHydrationWarning
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id={fieldId("weight")}
              label="Weight (kg)"
              error={errors.weight}
              errorId={fieldId("weight-error")}
            >
              <Input
                id={fieldId("weight")}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                aria-invalid={Boolean(errors.weight)}
                aria-describedby={describedBy("weight")}
                required
                suppressHydrationWarning
              />
            </Field>

            <div className="space-y-1">
              <label
                htmlFor={fieldId("status")}
                className="text-sm font-medium"
              >
                Starting status
              </label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as PackageStatus)}
              >
                <SelectTrigger id={fieldId("status")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INITIAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create package"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/")}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
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
  children: React.ReactNode;
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
