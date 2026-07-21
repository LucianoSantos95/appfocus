
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_mode text,
  ADD COLUMN IF NOT EXISTS last_payment_id text,
  ADD COLUMN IF NOT EXISTS pending_renewal_url text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal
  ON public.subscriptions (payment_mode, current_period_end)
  WHERE payment_mode = 'one_time';
