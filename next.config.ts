import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mongoose ships its own build artifacts and should not be bundled by the
  // server compiler. Keeping it external avoids "Can't resolve" edge cases and
  // keeps model registration a true singleton across route handlers.
  serverExternalPackages: ["mongoose"],

  // Don't let `next dev` scaffold AGENTS.md / CLAUDE.md into the repo.
  agentRules: false,
};

export default nextConfig;
