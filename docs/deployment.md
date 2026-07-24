# Deployment Guide

## Prerequisites

- Bun ≥ 1.1
- A Supabase project (Postgres + Auth + Realtime)
- A Groq API key
- (Optional) A Discord webhook URL for critical alerts
- (Optional) A verified Lovable email domain for transactional email

## Lovable (recommended)

The app is a native Lovable project. Publish from the Lovable UI — the platform provisions Supabase, injects secrets, and deploys to Cloudflare Workers with a stable URL:

- Production: `project--<project-id>.lovable.app`
- Preview: `project--<project-id>-dev.lovable.app`

Environment variables are managed automatically for Supabase; add `GROQ_API_KEY` via **Cloud → Secrets**.

## Self-host

```bash
bun install
bun run build         # produces dist/ (Nitro output for Cloudflare)
```

Deploy `dist/` to any Nitro-supported target:

```bash
npx nitro deploy --prebuilt
```

Or run the preview server locally:

```bash
npx vite preview
```

### Environment variables

| Variable | Scope | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Publishable / anon key |
| `VITE_SUPABASE_PROJECT_ID` | client | Convenience ID |
| `SUPABASE_URL` | server | Same URL for server fns |
| `SUPABASE_PUBLISHABLE_KEY` | server | For server-side publishable client |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Server-only; never expose |
| `GROQ_API_KEY` | server | Required for classification |
| `LOVABLE_API_KEY` | server | Required for Lovable Email |

Runtime organisation settings (`discord_webhook_url`, `notify_email`, `auto_execute_threshold`) are managed in the `/settings` page and stored in `org_settings`.

## Database migrations

Migrations live under `supabase/migrations/`. Apply on a fresh database with the Supabase CLI:

```bash
supabase db push
```

## Post-deploy checks

1. Sign up — the first user is auto-promoted to Admin + Coordinator.
2. Configure Discord webhook + notify email in `/settings`.
3. Submit a test emergency from `/report` and confirm:
   - Row appears in `requests`.
   - `execution_logs` shows `ai_classified` with model name and latency.
   - Dashboard updates in real time.
