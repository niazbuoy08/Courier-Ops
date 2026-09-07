import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ExceptionIndicator } from "@/components/packages/exception-indicator";
import { formatDate, formatDateTime } from "@/lib/format";
import type { PackageSummary } from "@/types/package";

const focusRing =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PackagesTable({ packages }: { packages: PackageSummary[] }) {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <Table>
        <TableCaption className="sr-only">
          Packages, {packages.length} shown on this page
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead scope="col">Tracking ID</TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              Sender
            </TableHead>
            <TableHead scope="col">Receiver</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col" className="text-right">
              Last updated
            </TableHead>
            <TableHead scope="col" className="w-8">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => (
            <TableRow key={pkg.id} className="group">
              <TableCell className="font-medium">
                <Link
                  href={`/package/${pkg.id}`}
                  className={`hover:underline ${focusRing}`}
                >
                  {pkg.trackingId}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {pkg.sender}
              </TableCell>
              <TableCell>{pkg.receiver}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge status={pkg.status} />
                  {pkg.exception ? (
                    <ExceptionIndicator exception={pkg.exception} />
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                <time dateTime={pkg.updatedAt} className="sm:hidden">
                  {formatDate(pkg.updatedAt)}
                </time>
                <time dateTime={pkg.updatedAt} className="hidden sm:inline">
                  {formatDateTime(pkg.updatedAt)}
                </time>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Link
                  href={`/package/${pkg.id}`}
                  aria-label={`View ${pkg.trackingId}`}
                  className={`group-hover:text-foreground inline-flex ${focusRing}`}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
