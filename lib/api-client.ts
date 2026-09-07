import type {
  AddStatusEventBody,
  ApiError,
  CreatePackageBody,
  FlagExceptionBody,
  Package,
  Paginated,
  PackageStats,
  PackageStatus,
  PackageSummary,
  SortOrder,
  UpdatePackageBody,
} from "@/types/package";

/**
 * The single place the frontend talks to the backend. Every call goes through
 * `request()`, so JSON parsing, error shaping and the base URL are handled once.
 */

export class ApiClientError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }

  /** True when the session has expired / the user isn't signed in. */
  get isSessionExpired(): boolean {
    return this.status === 401;
  }
}

/** Optional absolute base (e.g. for server-side calls). Empty = same origin. */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiClientError(
      0,
      "Couldn't reach Courier Ops. Check your connection and try again.",
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = (payload ?? {}) as Partial<ApiError>;
    throw new ApiClientError(
      response.status,
      body.error ?? "Something went wrong. Please try again.",
      body.details,
    );
  }

  return payload as T;
}

/** Demo-only passthroughs wired to the backend's `?fail` / `?delay` hooks. */
export interface DemoControls {
  fail?: boolean;
  delay?: number;
}

export interface ListPackagesParams extends DemoControls {
  search?: string;
  status?: PackageStatus;
  exception?: boolean;
  overdue?: boolean;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === false) continue;
    query.set(key, String(value));
  }
  const string = query.toString();
  return string ? `?${string}` : "";
}

export function listPackages(
  params: ListPackagesParams = {},
  signal?: AbortSignal,
): Promise<Paginated<PackageSummary>> {
  const query = buildQuery({
    search: params.search,
    status: params.status,
    exception: params.exception ? "true" : undefined,
    overdue: params.overdue ? "true" : undefined,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
    fail: params.fail,
    delay: params.delay,
  });
  return request<Paginated<PackageSummary>>(`/api/packages${query}`, {
    signal,
  });
}

/**
 * URL for the CSV export of the current filtered list. This is a file download,
 * so it's used as a link target / `window.location`, not fetched through
 * `request()`.
 */
export function packagesExportUrl(
  params: Omit<ListPackagesParams, "page" | "pageSize"> = {},
): string {
  const query = buildQuery({
    search: params.search,
    status: params.status,
    exception: params.exception ? "true" : undefined,
    overdue: params.overdue ? "true" : undefined,
    sort: params.sort,
  });
  return `${BASE_URL}/api/packages/export${query}`;
}

export function getPackageStats(
  options: DemoControls & { signal?: AbortSignal } = {},
): Promise<PackageStats> {
  const query = buildQuery({ fail: options.fail, delay: options.delay });
  return request<PackageStats>(`/api/packages/summary${query}`, {
    signal: options.signal,
  });
}

export function getPackage(
  id: string,
  options: DemoControls & { signal?: AbortSignal } = {},
): Promise<Package> {
  const query = buildQuery({ fail: options.fail, delay: options.delay });
  return request<Package>(`/api/packages/${encodeURIComponent(id)}${query}`, {
    signal: options.signal,
  });
}

export function createPackage(body: CreatePackageBody): Promise<Package> {
  return request<Package>("/api/packages", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updatePackage(
  id: string,
  body: UpdatePackageBody,
): Promise<Package> {
  return request<Package>(`/api/packages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function addStatusEvent(
  id: string,
  body: AddStatusEventBody,
): Promise<Package> {
  return request<Package>(`/api/packages/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function flagException(
  id: string,
  body: FlagExceptionBody,
): Promise<Package> {
  return request<Package>(`/api/packages/${encodeURIComponent(id)}/exception`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
