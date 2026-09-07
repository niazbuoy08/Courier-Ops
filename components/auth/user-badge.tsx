import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import type { SessionUser } from "@/types/user";

export function UserBadge({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground hidden sm:inline">
        {user.name}
      </span>
      <span className="border-border rounded-full border px-2 py-0.5 text-xs capitalize">
        {user.role}
      </span>
      <form action={logoutAction}>
        <button
          type="submit"
          // Form-filler extensions add `fdprocessedid` before React hydrates.
          suppressHydrationWarning
          className="hover:bg-muted focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Sign out</span>
        </button>
      </form>
    </div>
  );
}
