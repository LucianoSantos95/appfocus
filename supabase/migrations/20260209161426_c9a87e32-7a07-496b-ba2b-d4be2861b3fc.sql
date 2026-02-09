
-- Create rate_limits table for tracking API usage per user
CREATE TABLE public.rate_limits (
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role should access this table (no user policies needed)
-- The edge function uses service role key to read/write

-- Cleanup function to remove old entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '2 hours';
$$;
