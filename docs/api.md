# API Reference

ResQAI has no public REST API surface by default. Client ↔ server communication uses TanStack `createServerFn` RPC calls.

## Server functions

| Function | File | Auth | Purpose |
|---|---|---|---|
| `submitRequest` | `src/lib/classify.functions.ts` | Public | Persist a request, call Groq, auto-execute or queue for review |
| `getRequestByCode` | `src/lib/classify.functions.ts` | Public | Track a request by its tracking code |
| `listRequests` | `src/lib/requests.functions.ts` | Coordinator+ | Command Center listing |
| `assignRequest` | `src/lib/requests.functions.ts` | Coordinator+ | Manual assignment |
| `decideRequest` | `src/lib/requests.functions.ts` | Coordinator+ | Approve / reject review-queue item |
| `updateTaskStatus` | `src/lib/requests.functions.ts` | Volunteer | Progress a task |
| `matchVolunteers` | `src/lib/matching.functions.ts` | Coordinator+ | AI-ranked volunteer list for a request |
| `getSettings` / `updateSettings` | `src/lib/settings.functions.ts` | Admin | Org settings |
| `getPublicStats` | `src/lib/public-stats.functions.ts` | Public | Aggregate landing-page metrics |

All inputs are validated with Zod. Errors surface with typed messages; provider errors are logged server-side and never leaked to the client.

## Database

Full schema mirror: [`../database/schema/schema.sql`](../database/schema/schema.sql).

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`, holds display data + volunteer profile (skills, geolocation, availability, performance) |
| `user_roles` | `admin` / `coordinator` / `volunteer` — checked via `has_role()` |
| `requests` | Every intake; includes AI classification fields |
| `execution_logs` | Append-only audit trail |
| `org_settings` | Per-org runtime config (webhook, notify email, threshold) |

### Row-Level Security

- `requests`: public insert (anonymous intake); read allowed to owner-by-code, assignee, or staff.
- `user_roles`: read-only to the row's user; writes via SQL migration or admin console.
- `execution_logs`: staff-only read.
- `org_settings`: admin-only write; coordinator+ read.

## Public HTTP endpoints

None yet. Webhooks (if added) belong under `src/routes/api/public/*` and must verify signatures before writes.
