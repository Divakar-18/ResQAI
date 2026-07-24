
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'coordinator', 'volunteer');
CREATE TYPE public.req_intent AS ENUM (
  'medical_emergency','flood_rescue','food_shortage','fire','shelter_needed',
  'missing_person','animal_rescue','power_failure','road_block','water_supply',
  'medical_supply','volunteer_request','donation_request','other'
);
CREATE TYPE public.req_priority AS ENUM ('critical','high','medium','low');
CREATE TYPE public.req_department AS ENUM (
  'medical_team','fire_department','food_relief','police','ngo','volunteer_team','municipality'
);
CREATE TYPE public.req_sentiment AS ENUM ('panic','distressed','urgent','neutral');
CREATE TYPE public.req_status AS ENUM (
  'pending_ai','awaiting_review','approved','assigned','in_progress','completed','rejected','cancelled'
);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','coordinator')
  )
$$;

-- profiles policies
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));

-- user_roles policies
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- ============ REQUESTS ============
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT NOT NULL UNIQUE DEFAULT ('RSQ-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  citizen_name TEXT NOT NULL,
  citizen_phone TEXT,
  citizen_email TEXT,
  location_text TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  description TEXT NOT NULL,
  -- AI classification
  intent public.req_intent,
  priority public.req_priority,
  department public.req_department,
  sentiment public.req_sentiment,
  confidence NUMERIC(5,2), -- 0-100
  ai_reasoning TEXT,
  ai_model TEXT,
  -- workflow
  status public.req_status NOT NULL DEFAULT 'pending_ai',
  assigned_volunteer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  auto_executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.requests (status);
CREATE INDEX ON public.requests (priority);
CREATE INDEX ON public.requests (created_at DESC);
CREATE INDEX ON public.requests (assigned_volunteer_id);

GRANT SELECT, INSERT, UPDATE ON public.requests TO authenticated;
GRANT SELECT, INSERT ON public.requests TO anon;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can submit a request
CREATE POLICY "Anyone can submit requests" ON public.requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Staff can see everything
CREATE POLICY "Staff read all requests" ON public.requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
-- Volunteers see their assigned
CREATE POLICY "Volunteers read assigned" ON public.requests
  FOR SELECT TO authenticated USING (assigned_volunteer_id = auth.uid());
-- Staff can update anything
CREATE POLICY "Staff update requests" ON public.requests
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
-- Volunteers can update status of own
CREATE POLICY "Volunteers update own assigned" ON public.requests
  FOR UPDATE TO authenticated USING (assigned_volunteer_id = auth.uid());

-- ============ EXECUTION LOGS ============
CREATE TABLE public.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_kind TEXT NOT NULL, -- 'ai','system','coordinator','volunteer','citizen'
  action TEXT NOT NULL,     -- 'classified','assigned','notified_slack','emailed','approved','rejected','status_changed'
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.execution_logs (request_id);
CREATE INDEX ON public.execution_logs (created_at DESC);

GRANT SELECT ON public.execution_logs TO authenticated;
GRANT ALL ON public.execution_logs TO service_role;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read all logs" ON public.execution_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Volunteers read own request logs" ON public.execution_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.requests r WHERE r.id = execution_logs.request_id AND r.assigned_volunteer_id = auth.uid())
  );

-- ============ ORG SETTINGS ============
CREATE TABLE public.org_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  slack_webhook_url TEXT,
  auto_execute_threshold NUMERIC(5,2) NOT NULL DEFAULT 80.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO public.org_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read settings" ON public.org_settings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin update settings" ON public.org_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Auto-create profile + first user = admin+coordinator, subsequent = volunteer by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, display_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'coordinator') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'volunteer') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
