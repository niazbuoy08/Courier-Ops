/**
 * Seeds the database with a realistic set of packages and status histories.
 *
 *   npm run seed
 *
 * Loads env the same way Next.js does (`.env.local` etc.), wipes the `users`
 * and `packages` collections, then inserts two demo accounts and a fresh spread
 * of packages across every status. Safe to re-run — it always starts clean.
 */
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { PackageModel } from "@/models/package";
import { UserModel } from "@/models/user";
import { hashPassword } from "@/lib/auth/password";
import {
  PACKAGE_STATUS_FLOW,
  type ExceptionReason,
  type PackageStatus,
} from "@/types/package";
import type { UserRole } from "@/types/user";

const DEMO_USERS: {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}[] = [
  {
    email: "dispatcher@courier.dev",
    name: "Dana Dispatcher",
    role: "dispatcher",
    password: "dispatch123",
  },
  {
    email: "viewer@courier.dev",
    name: "Vic Viewer",
    role: "viewer",
    password: "viewer123",
  },
];

/** Small seeded PRNG so re-seeding produces a stable data set. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260907);
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(items: readonly T[]): T => items[randInt(0, items.length - 1)];

const SENDERS = [
  "Northwind Traders",
  "Globex Corporation",
  "Acme Supplies Co.",
  "Umbrella Retail",
  "Initech LLC",
  "Wayne Enterprises",
  "Stark Industries",
  "Wonka Distribution",
  "Cyberdyne Systems",
  "Aperture Retail",
  "Dunder Mifflin Paper",
  "Vandelay Industries",
] as const;

const FIRST_NAMES = [
  "Maya",
  "Liam",
  "Priya",
  "Noah",
  "Sofia",
  "Ethan",
  "Amara",
  "Lucas",
  "Chloe",
  "Diego",
  "Hannah",
  "Omar",
  "Isla",
  "Ravi",
  "Elena",
  "Marcus",
  "Yuki",
  "Grace",
] as const;

const LAST_NAMES = [
  "Bennett",
  "Okafor",
  "Nguyen",
  "Patel",
  "Rossi",
  "Hansen",
  "Silva",
  "Kim",
  "Fischer",
  "Reyes",
  "Andersson",
  "Haddad",
  "Murphy",
  "Kowalski",
  "Ito",
  "Delgado",
] as const;

/** Route stops: [origin, sort hub, destination]. */
const ROUTES = [
  ["Newark, NJ", "Memphis, TN", "Austin, TX"],
  ["Oakland, CA", "Denver, CO", "Chicago, IL"],
  ["Seattle, WA", "Salt Lake City, UT", "Phoenix, AZ"],
  ["Boston, MA", "Columbus, OH", "Nashville, TN"],
  ["Atlanta, GA", "Charlotte, NC", "Miami, FL"],
  ["Portland, OR", "Reno, NV", "Sacramento, CA"],
] as const;

const STREETS = [
  "Maple Ave",
  "Cedar St",
  "Lakeview Dr",
  "Franklin Blvd",
  "Sunset Ct",
  "Birch Ln",
  "Harbor Rd",
  "Willow Way",
  "Chestnut St",
  "Riverside Dr",
] as const;

function trackingId(n: number): string {
  return `CX${100000000 + n * 7919}`;
}

function locationFor(status: PackageStatus, route: readonly string[]): string {
  const [origin, hub, dest] = route;
  switch (status) {
    case "Pending":
      return `Registered — ${origin}`;
    case "Picked up":
      return `Picked up — ${origin}`;
    case "In transit":
      return `In transit — ${hub} sort facility`;
    case "Out for delivery":
      return `Out for delivery — ${dest} station`;
    case "Delivered":
      return `Delivered — ${dest}`;
    case "Delayed":
      return `Held at ${hub} — weather delay`;
  }
}

interface SeedEvent {
  status: PackageStatus;
  location: string;
  timestamp: Date;
}

function buildTimeline(
  target: PackageStatus,
  start: Date,
  route: readonly string[],
): SeedEvent[] {
  const events: SeedEvent[] = [];
  let t = start.getTime();
  // Never let a scan land in the future.
  const cap = Date.now() - randInt(1, 36) * 60 * 60 * 1000;
  const advance = () => {
    t += randInt(5, 22) * 60 * 60 * 1000; // 5–22 hours between scans
  };

  const stopAt: PackageStatus =
    target === "Delayed" ? pick(["Picked up", "In transit"] as const) : target;

  for (const status of PACKAGE_STATUS_FLOW) {
    events.push({
      status,
      location: locationFor(status, route),
      timestamp: new Date(Math.min(t, cap)),
    });
    if (status === stopAt) break;
    advance();
  }

  if (target === "Delayed") {
    advance();
    events.push({
      status: "Delayed",
      location: locationFor("Delayed", route),
      timestamp: new Date(t),
    });
  }

  return events;
}

/** Target status for each of the 18 packages — a deliberate spread. */
const STATUS_PLAN: PackageStatus[] = [
  "Delivered",
  "Delivered",
  "Delivered",
  "Delivered",
  "Out for delivery",
  "Out for delivery",
  "Out for delivery",
  "In transit",
  "In transit",
  "In transit",
  "In transit",
  "Picked up",
  "Picked up",
  "Picked up",
  "Pending",
  "Pending",
  "Pending",
  "Pending",
];

/** A few in-flight packages also carry a delivery exception (by plan index). */
const EXCEPTION_PLAN: Record<
  number,
  { reason: ExceptionReason; note?: string }
> = {
  4: {
    reason: "Customer unavailable",
    note: "No answer at the door; card left.",
  },
  8: { reason: "Delivery delayed", note: "Weather hold at regional hub." },
  15: { reason: "Wrong address", note: "Unit number missing from label." },
};

const DISPATCHER = DEMO_USERS[0];

function phoneNumber(n: number): string {
  return `+1 555 0${String(100 + (n % 900)).padStart(3, "0")}`;
}

async function main() {
  loadEnvConfig(process.cwd());
  // Imported here (not at top level) so env is loaded before `lib/db.ts`,
  // which reads MONGODB_URI at module load.
  const { connectToDatabase } = await import("@/lib/db");

  await connectToDatabase();
  await PackageModel.syncIndexes();
  await UserModel.syncIndexes();

  await UserModel.deleteMany({});
  await UserModel.insertMany(
    await Promise.all(
      DEMO_USERS.map(async (user) => ({
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: await hashPassword(user.password),
      })),
    ),
  );
  console.log(`Seeded ${DEMO_USERS.length} users:`);
  console.table(
    DEMO_USERS.map((user) => ({
      email: user.email,
      role: user.role,
      password: user.password,
    })),
  );
  console.log("");

  const deleted = await PackageModel.deleteMany({});
  console.log(`Cleared ${deleted.deletedCount} existing package(s).`);

  const now = Date.now();
  const docs = STATUS_PLAN.map((target, i) => {
    const route = pick(ROUTES);
    const receiver = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    // Start far enough back that the whole flow finishes before "now".
    const steps = PACKAGE_STATUS_FLOW.indexOf(
      target as (typeof PACKAGE_STATUS_FLOW)[number],
    );
    const daysBack = rand(0.5, 3) + Math.max(0, steps) * 1.3;
    const start = new Date(now - daysBack * 24 * 60 * 60 * 1000);
    const events = buildTimeline(target, start, route).map((event) => ({
      ...event,
      updatedByEmail: DISPATCHER.email,
      updatedByName: DISPATCHER.name,
      updatedByRole: DISPATCHER.role,
    }));
    const last = events[events.length - 1];
    const flagged = EXCEPTION_PLAN[i];

    return {
      trackingId: trackingId(i + 1),
      sender: pick(SENDERS),
      receiver,
      receiverAddress: `${randInt(100, 9899)} ${pick(STREETS)}, ${route[2]}`,
      receiverPhone: phoneNumber(i + 1),
      weight: Number(rand(0.2, 24).toFixed(1)),
      status: last.status,
      exception: flagged
        ? {
            reason: flagged.reason,
            ...(flagged.note ? { note: flagged.note } : {}),
            flaggedAt: last.timestamp,
            flaggedByName: DISPATCHER.name,
            flaggedByRole: DISPATCHER.role,
          }
        : null,
      events,
      createdAt: events[0].timestamp,
      updatedAt: last.timestamp,
    };
  });

  await PackageModel.insertMany(docs);
  // insertMany forces createdAt/updatedAt to "now"; restore our spread of dates
  // in one round-trip with timestamps auto-touch disabled.
  await PackageModel.bulkWrite(
    docs.map((d) => ({
      updateOne: {
        filter: { trackingId: d.trackingId },
        update: { $set: { createdAt: d.createdAt, updatedAt: d.updatedAt } },
      },
    })),
    { timestamps: false },
  );
  console.log(`Inserted ${docs.length} packages:\n`);

  console.table(
    docs.map((d) => ({
      trackingId: d.trackingId,
      receiver: d.receiver,
      status: d.status,
      events: d.events.length,
      exception: d.exception ? d.exception.reason : "—",
      updated: d.updatedAt.toISOString().slice(0, 10),
    })),
  );

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
  void mongoose.disconnect();
});
