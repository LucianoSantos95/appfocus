-- Replace the per-insert DELETE trigger on login_attempts with a pg_cron job.
-- The trigger ran a full DELETE on every login attempt, serialising all logins
-- through a table lock. A scheduled job every 30 minutes is equivalent and
-- does not block the write path.

DROP TRIGGER IF EXISTS trg_cleanup_login_attempts ON public.login_attempts;
DROP FUNCTION IF EXISTS public.cleanup_old_login_attempts();

SELECT cron.schedule(
  'cleanup-login-attempts',
  '*/30 * * * *',
  $$DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '1 hour'$$
);
