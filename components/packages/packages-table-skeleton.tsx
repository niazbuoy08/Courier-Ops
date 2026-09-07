import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function PackagesTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      aria-hidden
      className="border-border overflow-hidden rounded-lg border"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Tracking ID</TableHead>
            <TableHead className="hidden md:table-cell">Sender</TableHead>
            <TableHead>Receiver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Last updated</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell className="flex justify-end">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="size-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
