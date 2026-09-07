"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, updatePackage } from "@/lib/api-client";
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
import { FormField } from "@/components/packages/form-field";
import type { Package, UpdatePackageBody } from "@/types/package";

type FieldErrors = Partial<Record<keyof UpdatePackageBody | "weight", string>>;

const FIELD_ORDER: (keyof FieldErrors)[] = [
  "sender",
  "receiver",
  "receiverAddress",
  "receiverPhone",
  "weight",
];

export function EditPackageForm({ pkg }: { pkg: Package }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [sender, setSender] = useState(pkg.sender);
  const [receiver, setReceiver] = useState(pkg.receiver);
  const [receiverAddress, setReceiverAddress] = useState(pkg.receiverAddress);
  const [receiverPhone, setReceiverPhone] = useState(pkg.receiverPhone ?? "");
  const [weight, setWeight] = useState(String(pkg.weight));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldId = (name: string) => `${formId}-${name}`;
  const describedBy = (name: keyof FieldErrors) =>
    errors[name] ? fieldId(`${name}-error`) : undefined;

  function focusFirstError(current: FieldErrors) {
    const first = FIELD_ORDER.find((name) => current[name]);
    if (first) {
      formRef.current
        ?.querySelector<HTMLElement>(`#${CSS.escape(fieldId(first))}`)
        ?.focus();
    }
  }

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

    const trimmedPhone = receiverPhone.trim();
    const body: UpdatePackageBody = {
      sender: sender.trim(),
      receiver: receiver.trim(),
      receiverAddress: receiverAddress.trim(),
      // An empty field clears a stored phone number.
      receiverPhone: trimmedPhone ? trimmedPhone : null,
      weight: weightValue,
    };

    setSubmitting(true);
    try {
      await updatePackage(pkg.id, body);
      router.push(`/package/${pkg.id}`);
      router.refresh();
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
        setFormError("We couldn't save your changes. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit package</CardTitle>
        <CardDescription>
          <span className="font-mono">{pkg.trackingId}</span> · details can be
          edited until the package leaves the origin.
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

          <FormField
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
            />
          </FormField>

          <FormField
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
            />
          </FormField>

          <FormField
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
            />
          </FormField>

          <FormField
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
            />
          </FormField>

          <FormField
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
              className="sm:max-w-40"
            />
          </FormField>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/package/${pkg.id}`)}
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
