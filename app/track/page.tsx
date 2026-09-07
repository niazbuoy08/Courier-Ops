import type { Metadata } from "next";
import { Package } from "lucide-react";
import { TrackingLookupForm } from "@/components/tracking/tracking-lookup-form";

export const metadata: Metadata = {
  title: "Track a package",
};

export default function TrackLandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <Package className="size-5" aria-hidden />
        Courier Ops
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Track a package
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your tracking number to see its current status and delivery
          history.
        </p>
      </div>

      <TrackingLookupForm />
    </main>
  );
}
