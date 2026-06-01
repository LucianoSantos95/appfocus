ALTER TABLE public.onboarding_sessions ADD COLUMN IF NOT EXISTS user_name text;

UPDATE public.onboarding_sessions os
SET user_name = p.display_name
FROM public.profiles p
WHERE p.user_id = os.user_id AND os.user_name IS NULL;