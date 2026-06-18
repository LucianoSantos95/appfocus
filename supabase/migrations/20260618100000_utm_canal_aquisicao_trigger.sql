-- Update handle_new_user to persist canal_aquisicao from signup metadata.
-- The frontend passes utm_source as raw_user_meta_data->>'canal_aquisicao'
-- during supabase.auth.signUp(). Google OAuth users get NULL here and are
-- handled by the onAuthStateChange hook reading localStorage instead.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, canal_aquisicao)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'canal_aquisicao', '')), '')
  );
  RETURN NEW;
END;
$$;
