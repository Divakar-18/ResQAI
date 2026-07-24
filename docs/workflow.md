# Workflow

## Emergency request lifecycle

```text
┌──────────┐   submit    ┌────────────┐   insert   ┌──────────┐
│ Citizen  ├────────────▶│ submitReq  ├───────────▶│ Postgres │
└──────────┘             │ server fn  │            └────┬─────┘
                         └─────┬──────┘                 │
                               │ Groq classify           │
                               ▼                         │
                     ┌──────────────────┐                │
                     │  Structured JSON │                │
                     │  intent/priority │                │
                     │  dept/sentiment  │                │
                     │  confidence      │                │
                     └───┬──────────┬───┘                │
                         │          │                    │
              conf ≥ 0.80│          │conf < 0.80         │
                         ▼          ▼                    │
              ┌─────────────────┐  ┌──────────────────┐  │
              │ Auto-execute    │  │ Review Queue     │  │
              │ · match volunteer│ │ · coordinator UI │  │
              │ · assign        │  │ · manual dispatch│  │
              │ · notify        │  └────────┬─────────┘  │
              └────────┬────────┘           │            │
                       │                    │            │
                       ▼                    ▼            ▼
                  ┌──────────────────────────────────────┐
                  │            execution_logs             │
                  │      (immutable audit trail)          │
                  └──────────────────────────────────────┘
                                     │
                                     ▼
                       Supabase Realtime → Dashboard
```

## AI Matching Engine

Score (0–100) = distance (30) + skill match (25) + performance (25) + inverse workload (20).

The top-scoring available volunteer is selected. Ties break by most-recent completion first.

## Notifications

| Channel | Trigger |
|---|---|
| Email (Lovable Email) | Priority = critical, or after volunteer assignment |
| Discord webhook | Priority = critical, immediate |

## Audit

Every step (`request_created`, `ai_classified`, `auto_assigned`, `manual_assigned`, `notification_sent`, `status_changed`) is written to `execution_logs` with actor, model name, latency, and payload.
