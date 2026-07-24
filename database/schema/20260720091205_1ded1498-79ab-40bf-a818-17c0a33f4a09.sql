DROP POLICY IF EXISTS "Anon can read own just-inserted row" ON public.requests;
REVOKE SELECT ON public.requests FROM anon;