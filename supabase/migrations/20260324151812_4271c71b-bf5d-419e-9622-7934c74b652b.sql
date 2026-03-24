
CREATE TABLE public.whatsapp_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  whatsapp_number text,
  notify_tarefas boolean NOT NULL DEFAULT true,
  notify_clientes boolean NOT NULL DEFAULT true,
  notify_financeiro boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whatsapp_preferences"
  ON public.whatsapp_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp_preferences"
  ON public.whatsapp_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whatsapp_preferences"
  ON public.whatsapp_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_preferences_updated_at
  BEFORE UPDATE ON public.whatsapp_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_generic_updated_at();
