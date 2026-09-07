import { defineConfig } from "vitest/config";

/**
 * Unit-test setup. Tests run in the Node environment (the code under test is
 * pure domain logic — schemas, serializers, the status state machine — with no
 * DOM). Component and route-handler tests would add their own environment.
 *
 * `@/*` path aliases are resolved natively from tsconfig.json.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["{lib,types,app,components,hooks}/**/*.{test,spec}.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      /**
       * Scoped to the pure domain logic that unit tests own. Modules that only
       * run against real infrastructure — `db.ts`, `users.ts`, the `next/headers`
       * guards, the browser `api-client` — are covered by the integration and
       * E2E layers instead, so holding them to a unit-coverage bar here would be
       * misleading.
       */
      include: [
        "lib/api-helpers.ts",
        "lib/format.ts",
        "lib/serialize.ts",
        "lib/simulation.ts",
        "lib/validation.ts",
        "lib/auth/password.ts",
        "lib/auth/token.ts",
        "types/package.ts",
        "types/user.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
