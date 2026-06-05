CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_created_at ON public.onboarding_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_started_at ON public.onboarding_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_created ON public.onboarding_sessions (user_id, created_at DESC);