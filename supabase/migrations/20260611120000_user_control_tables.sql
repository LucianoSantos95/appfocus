-- ============================================================
-- User control tables, last-login tracking, and date indexes
-- 2026-06-11
-- ============================================================

-- ── 1. last_sign_in_at on profiles ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Sync auth.users.last_sign_in_at → profiles whenever user signs in
CREATE OR REPLACE FUNCTION public.handle_user_sign_in()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.profiles
    SET last_sign_in_at = NEW.last_sign_in_at
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_sign_in();

-- Back-fill: copy existing last_sign_in_at values from auth.users
UPDATE public.profiles p
SET last_sign_in_at = u.last_sign_in_at
FROM auth.users u
WHERE p.user_id = u.id
  AND p.last_sign_in_at IS NULL
  AND u.last_sign_in_at IS NOT NULL;

-- ── 2. stripe_webhook_events ─────────────────────────────────
-- Primary key is the Stripe event ID — prevents double-processing the same event.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id            TEXT        PRIMARY KEY,  -- evt_xxx from Stripe
  type          TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'processed', -- processed | failed | skipped
  payload       JSONB,
  error_message TEXT,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Stripe events are server-side only; no client access
CREATE POLICY "stripe_events_deny_all" ON public.stripe_webhook_events
  AS RESTRICTIVE USING (false);

-- ── 3. consent_records ──────────────────────────────────────
-- LGPD Art. 8: every consent must be recorded with date and version.
CREATE TABLE IF NOT EXISTS public.consent_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  consent_type TEXT        NOT NULL, -- 'terms_of_service' | 'privacy_policy' | 'lgpd' | 'marketing_emails'
  version      TEXT        NOT NULL DEFAULT '1.0',
  accepted     BOOLEAN     NOT NULL DEFAULT TRUE,
  ip_address   TEXT,
  user_agent   TEXT,
  accepted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_select_own" ON public.consent_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consent_insert_own" ON public.consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 4. plan_change_history ──────────────────────────────────
-- Append-only log of every plan transition: new, upgrade, downgrade, cancel, reactivate.
-- Enables churn analysis and average-time-to-upgrade metrics.
CREATE TABLE IF NOT EXISTS public.plan_change_history (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL,
  from_plan              TEXT,        -- NULL on first subscription
  to_plan                TEXT        NOT NULL,
  change_type            TEXT        NOT NULL, -- 'new' | 'upgrade' | 'downgrade' | 'cancel' | 'reactivate'
  stripe_subscription_id TEXT,
  metadata               JSONB,
  changed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.plan_change_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_history_select_own" ON public.plan_change_history
  FOR SELECT USING (auth.uid() = user_id);
-- Writes come from server-side edge functions only
CREATE POLICY "plan_history_deny_client_write" ON public.plan_change_history
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);

-- ── 5. referrals ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID        NOT NULL,
  referred_email   TEXT        NOT NULL,
  referred_user_id UUID,        -- populated when the referred user signs up
  referral_code    TEXT        NOT NULL UNIQUE,
  status           TEXT        NOT NULL DEFAULT 'pending', -- pending | signed_up | converted | expired
  reward_granted   BOOLEAN     NOT NULL DEFAULT FALSE,
  converted_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_user_id);
CREATE POLICY "referrals_insert_own" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);
CREATE POLICY "referrals_update_own" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_user_id);

-- ── 6. user_preferences ─────────────────────────────────────
-- Centralizes settings that today live only in localStorage:
-- theme, timezone, per-module notification toggles, sidebar state.
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID        NOT NULL UNIQUE,
  theme                        TEXT        NOT NULL DEFAULT 'system', -- 'light' | 'dark' | 'system'
  language                     TEXT        NOT NULL DEFAULT 'pt-BR',
  timezone                     TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
  notify_email_weekly_report   BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_email_product_updates BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_inapp_tasks           BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_inapp_clientes        BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_inapp_financeiro      BOOLEAN     NOT NULL DEFAULT TRUE,
  sidebar_collapsed            BOOLEAN     NOT NULL DEFAULT FALSE,
  dashboard_widgets            JSONB       NOT NULL DEFAULT '{}',
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_all_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 7. data_export_requests ─────────────────────────────────
-- LGPD Art. 18: right to data portability. Tracks export jobs from
-- request through delivery.
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'pending', -- pending | processing | ready | delivered | expired
  download_url        TEXT,
  download_expires_at TIMESTAMPTZ,
  processed_at        TIMESTAMPTZ,
  metadata            JSONB,
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export_select_own" ON public.data_export_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "export_insert_own" ON public.data_export_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 8. Date-ordering indexes ─────────────────────────────────
-- Composite (user_id, created_at DESC) means RLS filter + date sort
-- are both satisfied by a single index scan.

-- New tables
CREATE INDEX IF NOT EXISTS idx_consent_records_user_date
  ON public.consent_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_change_history_user_date
  ON public.plan_change_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_date
  ON public.referrals(referrer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_date
  ON public.data_export_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_date
  ON public.stripe_webhook_events(created_at DESC);

-- profiles — find recently active users fast
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in
  ON public.profiles(last_sign_in_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_user_created
  ON public.profiles(created_at DESC);

-- Core data tables (complement the user_id indexes added earlier)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_date
  ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_date
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_date
  ON public.user_milestones(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_date
  ON public.onboarding_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_date
  ON public.subscriptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_automation_log_user_date
  ON public.email_automation_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_user_date
  ON public.import_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriber_followups_user_date
  ON public.subscriber_followups(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_user_date
  ON public.transacoes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_user_date
  ON public.clientes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projetos_user_date
  ON public.projetos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tarefas_user_date
  ON public.tarefas(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_date
  ON public.colaboradores(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campanhas_user_date
  ON public.campanhas(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processos_user_date
  ON public.processos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conteudos_user_date
  ON public.conteudos(user_id, created_at DESC);
