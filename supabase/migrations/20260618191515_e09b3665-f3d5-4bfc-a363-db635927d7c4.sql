ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS canal_aquisicao text DEFAULT NULL;

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