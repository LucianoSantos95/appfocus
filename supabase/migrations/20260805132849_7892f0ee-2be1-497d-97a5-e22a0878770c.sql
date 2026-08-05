-- 1. Sessions table
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  duration_sec integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON public.user_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id, last_seen_at DESC);

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();

-- 2. Owner check
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'oluciano.dosantos@gmail.com'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated, service_role;

-- 3. Overview
CREATE OR REPLACE FUNCTION public.owner_users_overview()
RETURNS TABLE(
  total_users bigint,
  new_7d bigint,
  new_30d bigint,
  active_7d bigint,
  active_30d bigint,
  paid_users bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM auth.users),
    (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
    (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '30 days'),
    (SELECT count(DISTINCT user_id) FROM public.user_daily_activity WHERE day > current_date - 7),
    (SELECT count(DISTINCT user_id) FROM public.user_daily_activity WHERE day > current_date - 30),
    (SELECT count(*) FROM public.subscriptions WHERE status = 'active' AND lower(plan) <> 'gratuito');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.owner_users_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_users_overview() TO authenticated, service_role;

-- 4. Users list (recent access / activity / time on platform combined)
CREATE OR REPLACE FUNCTION public.owner_users_list()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  plan text,
  signed_up_at timestamptz,
  last_sign_in_at timestamptz,
  last_active_at timestamptz,
  actions_30d bigint,
  actions_90d bigint,
  active_days_30d bigint,
  classificacao text,
  actions_by_module jsonb,
  sessions_count bigint,
  total_time_sec bigint,
  avg_session_sec integer,
  funnel_stage text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(p.display_name, split_part(u.email::text, '@', 1)),
    COALESCE(s.plan, 'gratuito'),
    u.created_at,
    p.last_sign_in_at,
    e.last_active_at,
    COALESCE(e.total_actions_30d, 0),
    COALESCE(e.total_actions_90d, 0),
    COALESCE(e.active_days_30d, 0),
    e.classificacao,
    e.actions_by_module,
    COALESCE(ses.cnt, 0),
    COALESCE(ses.total_sec, 0),
    COALESCE(ses.avg_sec, 0)::integer,
    f.stage::text
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.subscriptions s ON s.user_id = u.id
  LEFT JOIN public.vw_user_engagement e ON e.user_id = u.id
  LEFT JOIN public.user_funnel_stage f ON f.user_id = u.id
  LEFT JOIN (
    SELECT us.user_id AS uid,
           count(*) AS cnt,
           sum(us.duration_sec)::bigint AS total_sec,
           avg(us.duration_sec) AS avg_sec
    FROM public.user_sessions us
    GROUP BY us.user_id
  ) ses ON ses.uid = u.id
  ORDER BY COALESCE(e.last_active_at, p.last_sign_in_at, u.created_at) DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.owner_users_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_users_list() TO authenticated, service_role;