"use client";

import { useMemo, useState } from "react";
import { ScrollText, TriangleAlert, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildActivity, type ActivityKind } from "@/lib/activity";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type { Package } from "@/types/package";

type Filter = "all" | ActivityKind;

/**
 * Internal audit trail for the detail page: who did what and when, across
 * status changes and the exception flag, newest first, filterable by kind.
 */
export function ActivityLog({ pkg }: { pkg: Package }) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    const all = buildActivity(pkg);
    const filtered =
      filter === "all" ? all : all.filter((item) => item.kind === filter);
    return [...filtered].reverse();
  }, [pkg, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="size-4" aria-hidden />
          Activity log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <SelectTrigger className="h-8 w-40" aria-label="Filter activity log">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="status">Status changes</SelectItem>
            <SelectItem value="exception">Exceptions</SelectItem>
          </SelectContent>
        </Select>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing to show.</p>
        ) : (
          <ol className="space-y-4" aria-label="Activity, most recent first">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 text-sm">
                <span
                  className={
                    item.kind === "exception"
                      ? "mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground mt-0.5 shrink-0"
                  }
                >
                  {item.kind === "exception" ? (
                    <TriangleAlert className="size-4" aria-hidden />
                  ) : (
                    <Truck className="size-4" aria-hidden />
                  )}
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium">{item.title}</p>
                  {item.detail ? (
                    <p className="text-muted-foreground">{item.detail}</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    <time dateTime={item.at}>{formatDateTime(item.at)}</time> ·{" "}
                    {formatRelativeTime(item.at)}
                    {item.actor ? ` · by ${item.actor}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
