import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatWeight } from "@/lib/format";
import type { Package } from "@/types/package";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

export function PackageInfoCard({ pkg }: { pkg: Package }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Package details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tracking ID">
            <span className="font-mono">{pkg.trackingId}</span>
          </Field>
          <Field label="Status">
            <StatusBadge status={pkg.status} />
          </Field>
          <Field label="Sender">{pkg.sender}</Field>
          <Field label="Receiver">{pkg.receiver}</Field>
          <Field label="Phone">
            {pkg.receiverPhone ? (
              pkg.receiverPhone
            ) : (
              <span className="text-muted-foreground">Not provided</span>
            )}
          </Field>
          <Field label="Weight">{formatWeight(pkg.weight)}</Field>
          <Field label="Created">{formatDateTime(pkg.createdAt)}</Field>
          <Field label="Delivery address" className="sm:col-span-2">
            {pkg.receiverAddress}
          </Field>
        </dl>
      </CardContent>
    </Card>
  );
}
