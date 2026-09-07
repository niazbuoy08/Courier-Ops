"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm({
  callbackUrl,
  notice,
}: {
  callbackUrl?: string;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription>
          Courier Ops is an internal system. Sign in to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notice ? (
          <p
            role="status"
            className="border-border bg-muted/50 mb-3 rounded-md border px-3 py-2 text-sm"
          >
            {notice}
          </p>
        ) : null}
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="h-9"
              // Password managers mutate login inputs before hydration.
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-9"
              suppressHydrationWarning
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
