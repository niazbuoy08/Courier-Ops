import Link from "next/link";
import { Package } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { UserBadge } from "@/components/auth/user-badge";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="bg-background focus-visible:ring-ring sr-only rounded-md border px-3 py-2 text-sm font-medium focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:ring-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <header className="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4"
        >
          <Link
            href="/"
            className="focus-visible:ring-ring flex items-center gap-2 rounded-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
          >
            <Package className="size-5" aria-hidden />
            Courier Ops
          </Link>
          {session ? <UserBadge user={session} /> : null}
        </nav>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6"
      >
        {children}
      </main>
    </div>
  );
}
