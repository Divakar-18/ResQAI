ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS recommended_resources text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS estimated_response_minutes int,
  ADD COLUMN IF NOT EXISTS suggested_volunteer_skill text,
  ADD COLUMN IF NOT EXISTS match_score int,
  ADD COLUMN IF NOT EXISTS match_reason text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS performance_score int NOT NULL DEFAULT 75,
  ADD COLUMN IF NOT EXISTS completed_count int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_requests_assigned_volunteer ON public.requests(assigned_volunteer_id) WHERE assigned_volunteer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);