# Architecture

ResQAI is a full-stack TanStack Start application deployed on Cloudflare Workers with a Supabase Postgres backend and direct calls to the Groq API for AI classification.

## High-level diagram

```text
                   ┌────────────────────────────────┐
                   │             Client              │
                   │  React 19 + TanStack Router     │
                   │  Tailwind v4 · framer-motion    │
                   │  Leaflet + OpenStreetMap tiles  │
                   └──────────────┬─────────────────┘
                                  │  createServerFn (RPC)
                                  ▼
                   ┌────────────────────────────────┐
                   │  TanStack Start server runtime │
                   │  (Cloudflare Workers)          │
                   │  · server functions            │
                   │  · /api/public/* routes        │
                   └──┬─────────────┬────────────┬──┘
                      │             │            │
                ┌─────▼────┐  ┌─────▼─────┐  ┌───▼──────────┐
                │ Supabase │  │  Groq API │  │ Notifications│
                │ Postgres │  │ LLaMA 3.3 │  │ Discord/Email│
                │  + Auth  │  │           │  │              │
                │  + RLS   │  └───────────┘  └──────────────┘
                │  + RT    │
                └──────────┘
```

## Modules

| Layer | Location | Notes |
|---|---|---|
| Pages / routes | `src/routes/**` | File-based; pathless `_authenticated/` gates protected pages |
| Server functions | `src/lib/*.functions.ts` | RPC entry points; validate input with Zod |
| Domain services | `src/lib/*.server.ts` | Server-only helpers (Groq, Discord, Email) |
| Realtime hooks | `src/hooks/use-requests-realtime.ts` | Subscribes to Supabase channels |
| UI components | `src/components/**` | shadcn/ui + feature widgets |
| Supabase clients | `src/integrations/supabase/*` | Generated — do not edit |

## Auth & RBAC

- Supabase Auth (email/password + Google OAuth).
- Roles stored in a dedicated `user_roles` table with a `has_role()` security-definer function.
- Protected pages live under `src/routes/_authenticated/*` and use an `ssr: false` gate.

## Realtime

`ALTER PUBLICATION supabase_realtime ADD TABLE public.requests` is enabled; the `useRequestsRealtime` hook subscribes with a unique channel name per component to prevent duplicate-subscription errors.

## Failure modes

- Groq outage → the request is still persisted; the response defaults to low confidence and the case flows into the review queue.
- Discord / email failure → logged in `execution_logs` but does not block the workflow.
- Auth cold-start → protected loaders bail via the managed `_authenticated` layout redirect.
