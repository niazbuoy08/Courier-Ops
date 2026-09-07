"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PACKAGE_STATUSES } from "@/types/package";
import type { PackageStatus, SortOrder } from "@/types/package";

const ANY_STATUS = "all";
const SEARCH_DEBOUNCE_MS = 300;

export interface PackagesToolbarProps {
  search: string;
  status?: PackageStatus;
  sort: SortOrder;
  exceptionsOnly: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value?: PackageStatus) => void;
  onSortChange: (value: SortOrder) => void;
  onExceptionsOnlyChange: (value: boolean) => void;
}

export function PackagesToolbar({
  search,
  status,
  sort,
  exceptionsOnly,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onExceptionsOnlyChange,
}: PackagesToolbarProps) {
  const [draft, setDraft] = useState(search);
  const [committedSearch, setCommittedSearch] = useState(search);

  // Adjust local state when the query changes elsewhere (back button, clear
  // filters). This is the render-phase "prop changed" pattern, not an effect.
  if (search !== committedSearch) {
    setCommittedSearch(search);
    setDraft(search);
  }

  // Debounce so a URL update / refetch happens once the user pauses typing.
  useEffect(() => {
    if (draft === search) return;
    const timeout = setTimeout(() => onSearchChange(draft), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [draft, search, onSearchChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor="package-search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="package-search"
            type="search"
            placeholder="Tracking ID, sender, receiver, or phone"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </label>
          <Select
            value={status ?? ANY_STATUS}
            onValueChange={(value) =>
              onStatusChange(
                value === ANY_STATUS ? undefined : (value as PackageStatus),
              )
            }
          >
            <SelectTrigger
              id="status-filter"
              aria-label="Filter by status"
              className="h-9 w-full sm:w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_STATUS}>All statuses</SelectItem>
              {PACKAGE_STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label htmlFor="sort-order" className="text-sm font-medium">
            Sort
          </label>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as SortOrder)}
          >
            <SelectTrigger
              id="sort-order"
              aria-label="Sort order"
              className="h-9 w-full sm:w-40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary focus-visible:ring-ring size-4 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          checked={exceptionsOnly}
          onChange={(event) => onExceptionsOnlyChange(event.target.checked)}
        />
        Only show packages that need attention
      </label>
    </div>
  );
}
