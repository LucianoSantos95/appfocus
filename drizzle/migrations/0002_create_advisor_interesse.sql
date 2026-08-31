CREATE TABLE public.advisor_interesse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta boolean NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.advisor_interesse TO anon, authenticated;
GRANT SELECT ON public.advisor_interesse TO authenticated;
GRANT ALL ON public.advisor_interesse TO service_role;

ALTER TABLE public.advisor_interesse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_interesse_public_insert"
ON public.advisor_interesse FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "advisor_interesse_admin_select"
ON public.advisor_interesse FOR SELECT
TO authenticated
USING (public.is_platform_owner() OR public.has_role(auth.uid(), 'admin'));