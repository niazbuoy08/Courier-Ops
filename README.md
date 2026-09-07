# Courier Ops Dashboard

An internal operations tool for a parcel‑delivery company. Dispatchers register
packages, push tracking scans as a shipment moves through the network, and flag
the ones that need attention; viewers get read‑only visibility into every
shipment. Built as a full‑stack **Next.js 16 (App Router) + MongoDB** app with
its own session auth, role‑based access control, and a forward‑only shipment
state machine enforced on the server.

<!--
  Screenshots make this page. Drop three images in docs/ and uncomment:

  ![Dashboard — package list with search, status filter and summary counts](docs/dashboard.png)
  ![Package detail — tracking timeline, live simulation, exception panel](docs/package-detail.png)
  ![Login — role-based demo accounts](docs/login.png)
-->

---

## Highlights

- **Custom session auth, no library.** Stateless JWT sessions (`jose`, HS256) in
  an `httpOnly` cookie, `bcrypt` password hashing, and a **constant‑time login
  path** — an invalid email still runs a bcrypt compare so response timing can't
  be used to enumerate accounts.
- **Role‑based access control.** Two roles (`dispatcher` / `viewer`). Every
  mutating route is guarded by `requireWriter()`; the UI hides actions a viewer
  can't take, and the API rejects them anyway (`403`) so the client is never
  trusted.
- **Server‑authoritative state machine.** A package moves `Pending → Picked up →
  In transit → Out for delivery → Delivered`, one step at a time, never
  backwards. Transitions are validated server‑side and applied as a
  **compare‑and‑swap** on the current status, so two concurrent updates can't
  skip or double‑advance a step.
- **Live Tracking Simulation.** A panel on the detail page fires real
  `PATCH /status` requests on a 5–8 s self‑rescheduling timer — Mongo is
  genuinely updated and the page re‑fetches. It's a demo of the pipeline, not a
  UI animation.
- **Validation everywhere.** Every request body and query string is parsed with
  **Zod**; field errors come back as `{ error, details: { field: [msg] } }` and
  render inline on the form. The list endpoint's query schema is deliberately
  lenient — bad params fall back to sane defaults instead of 400‑ing the whole
  page.
- **Considered data modelling.** Status events are **embedded** on the package
  document (bounded, always read together, atomic `$push` + `$set`) rather than
  a separate collection. Indexes are built around the actual query patterns, not
  sprinkled on hopefully.
- **Honest loading & error states.** Skeletons, empty states, retry buttons, and
  request cancellation via `AbortController`. Hidden `?fail=true` / `?delay=<ms>`
  hooks on the read endpoints let you demo those states on command.
- **Reproducible seed data.** `npm run seed` wipes and rebuilds a realistic
  spread of 18 packages across every status — with full timelines and a few
  exceptions — from a **seeded PRNG** (`mulberry32`), so the demo looks the same
  every run.

---

## Tech stack

| Area          | Choices                                                              |
| ------------- | ------------------------------------------------------------------- |
| Framework     | Next.js 16.3 (App Router, Server Components, Server Actions), React 19 |
| Language      | TypeScript (strict)                                                 |
| Database      | MongoDB Atlas + Mongoose 8                                          |
| Auth          | `jose` (JWT), `bcryptjs`, `httpOnly` cookie sessions, proxy‑level route guard |
| Validation    | Zod (request bodies, query strings, server actions)                 |
| UI            | Tailwind CSS v4, shadcn/ui + Base UI primitives, `lucide-react`, light/dark |
| Tooling       | ESLint 9, Prettier, `tsx` for the seed script                       |

---

## Architecture

```
Browser
  │  fetch() via lib/api-client.ts  (one place; JSON + error shaping + base URL)
  ▼
proxy.ts ......... redirects signed-out users to /login (pages only; APIs self-authorize)
  ▼
app/api/packages/**/route.ts
  ├─ requireUser() / requireWriter() .... session + role guard
  ├─ Zod schema ......................... parse & shape 400s
  ├─ lib/db.ts .......................... singleton Mongoose connection (survives HMR)
  ├─ models/ ............................ Package (+ embedded StatusEvent, Exception), User
  └─ lib/serialize.ts .................. Mongoose docs → JSON DTOs (ObjectId→id, Date→ISO, drop internals)
```

**Some decisions worth calling out**

- **Single connection across hot reloads.** `lib/db.ts` stashes the Mongoose
  connection on `globalThis`; without it, Turbopack's HMR opens a fresh
  connection per edit and exhausts the Atlas pool in seconds.
- **`proxy.ts` guards pages; routes guard themselves.** Page navigations get a
  redirect to `/login`; API routes return JSON `401/403` so the client can react
  without following an HTML redirect.
- **A serialization layer.** Handlers never return raw Mongoose documents. One
  module maps `_id → id`, `Date → ISO string`, sorts the timeline oldest‑first,
  and drops `__v` and the actor's email — so the wire shape is a deliberate DTO,
  not a leak of the schema.
- **Auditing derived from the session.** "Who changed this" is read from the
  verified session on the server and never accepted from the client.
- **Client data hooks with derived loading.** `usePackages` / `usePackage`
  key each result to its query; "loading" is *derived* from the stored key not
  matching the current query rather than set imperatively, which keeps effects
  free of synchronous state churn and makes stale responses impossible to render.

---

## Data model

**Package** (`models/package.ts`)

| Field             | Notes                                                            |
| ----------------- | -------------------------------------------------------------- |
| `trackingId`      | `CX` + 9 digits, unique, server‑assigned                       |
| `sender` / `receiver` / `receiverAddress` / `receiverPhone?` | contact + destination      |
| `weight`          | kilograms                                                      |
| `status`          | one of the 6 statuses; current position in the flow           |
| `exception`       | `{ reason, note?, flaggedAt, flaggedBy }` or `null`           |
| `events[]`        | embedded `StatusEvent` sub‑docs — the full tracking timeline   |
| `createdAt` / `updatedAt` | timestamps                                            |

Indexes: `{ status, createdAt }` (list + sort), `{ receiver }` (search),
`{ "exception.reason" }` (needs‑attention filter), plus the unique `trackingId`.

**User** (`models/user.ts`) — `email` (unique), `name`, `passwordHash` (never
serialized), `role`.

---

## API

All routes require a valid session. Writes require the `dispatcher` role.

| Method & path                        | Role       | Purpose                                                   |
| ------------------------------------ | ---------- | ------------------------------------------------------- |
| `GET /api/packages`                  | any        | List with `search`, `status`, `exception`, `page`, `pageSize`, `sort` |
| `POST /api/packages`                 | dispatcher | Create a package; server assigns the tracking ID + opening event |
| `GET /api/packages/summary`          | any        | Dashboard counts (aggregation): total, by status, exceptions |
| `GET /api/packages/[id]`             | any        | One package + full history; `id` is an ObjectId **or** a tracking ID |
| `PATCH /api/packages/[id]/status`    | dispatcher | Append a scan and advance the status (validated transition, CAS) |
| `PATCH /api/packages/[id]/exception` | dispatcher | Flag a package as needing attention, or clear it (`reason: null`) |

Read endpoints also accept `?fail=true` and `?delay=<ms>` (capped at 10 s) to
exercise the error and loading states.

---

## Getting started

### Prerequisites

- **Node.js 20+**
- A **MongoDB** connection string (a free MongoDB Atlas cluster works)

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable                  | Required | Description                                                    |
| ------------------------- | -------- | ------------------------------------------------------------ |
| `MONGODB_URI`             | yes      | MongoDB connection string, including the database name        |
| `AUTH_SECRET`             | yes      | Secret for signing session JWTs. Generate one with:<br>`node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"` |
| `NEXT_PUBLIC_API_BASE_URL`| no       | Absolute API base; leave blank to call the same origin        |

### 3. Seed the database

```bash
npm run seed
```

Wipes `users` and `packages`, then inserts the demo accounts and 18 packages
with full timelines. Safe to re‑run.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts

| Role       | Email                     | Password      | Can do                                      |
| ---------- | ------------------------- | ------------- | ----------------------------------------- |
| Dispatcher | `dispatcher@courier.dev` | `dispatch123` | Everything — create, advance status, flag exceptions |
| Viewer     | `viewer@courier.dev`     | `viewer123`   | Read‑only                                   |

---

## Scripts

| Command                | What it does                                  |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start the dev server                         |
| `npm run build`        | Production build                             |
| `npm run start`        | Serve the production build                   |
| `npm run seed`         | Reset + reseed the database                  |
| `npm run lint`         | ESLint                                       |
| `npm run format`       | Prettier write                               |

---

## Project structure

```
app/
  (app)/            authenticated area — package list, detail, create
  api/packages/     route handlers (list, create, summary, detail, status, exception)
  login/            login page + server actions
components/
  packages/         list, table, toolbar, timeline, detail, live-simulation, exception panels
  ui/               shadcn/ui primitives
  auth/             login form, user badge
hooks/              usePackages, usePackage, usePackageStats, useLiveSimulation, useSessionGuard
lib/
  auth/             token (sign/verify), session (cookie), guard (route), password (bcrypt)
  db.ts             singleton Mongoose connection
  api-client.ts     the one place the frontend calls the backend
  serialize.ts      Mongoose docs → JSON DTOs
  validation.ts     Zod schemas
models/             Package, StatusEvent (embedded), User
types/              shared domain types + the status-transition table
scripts/seed.ts     reproducible demo data
proxy.ts            page-level auth redirect (Next 16's middleware)
```

---

## Possible next steps

- Automated tests — the transition logic, guards, and serializer are pure and
  test‑friendly by design; a Playwright pass over the dispatcher/viewer flows
- Optimistic UI on status advance instead of re‑fetch
- Real map tiles + geocoding behind the current stylised location view
- Audit log surfaced in the UI (the data is already captured per event)
- CI: lint + typecheck + build on push
