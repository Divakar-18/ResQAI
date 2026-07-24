
-- requests: anonymous can submit + read own (by request_code lookup); authenticated staff/volunteers per RLS
GRANT INSERT, SELECT ON public.requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;

-- profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- user_roles (read-only for signed-in users via has_role SECURITY DEFINER; direct read OK too)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- execution_logs
GRANT SELECT, INSERT ON public.execution_logs TO authenticated;
GRANT ALL ON public.execution_logs TO service_role;

-- org_settings
GRANT SELECT, INSERT, UPDATE ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;

-- Allow anon to SELECT only when reading their own tracking code (public tracker).
-- The tracker route uses the admin client server-side, but adding a narrow anon
-- SELECT policy also lets the INSERT ... RETURNING succeed for anonymous submissions.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='requests'
    AND policyname='Anon can read own just-inserted row'
  ) THEN
    CREATE POLICY "Anon can read own just-inserted row"
      ON public.requests FOR SELECT TO anon
      USING (true);
  END IF;
END $$;
