
-- Tabela para dados extras dos assinantes
CREATE TABLE public.subscriber_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  origem text DEFAULT NULL,
  canal_aquisicao text DEFAULT NULL,
  data_conversao date DEFAULT NULL,
  ltv numeric DEFAULT 0,
  notas text DEFAULT NULL,
  tags text[] DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriber_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all subscriber_extras"
  ON public.subscriber_extras FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriber_extras"
  ON public.subscriber_extras FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriber_extras"
  ON public.subscriber_extras FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscriber_extras"
  ON public.subscriber_extras FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_subscriber_extras_updated_at
  BEFORE UPDATE ON public.subscriber_extras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_generic_updated_at();

-- View unificada de assinantes
CREATE OR REPLACE VIEW public.vw_assinantes AS
SELECT
  p.user_id,
  p.display_name,
  p.company_name,
  p.phone,
  p.segment,
  p.employee_count,
  p.created_at AS cadastro_em,
  s.plan AS plano,
  s.status AS status_assinatura,
  s.started_at AS assinatura_inicio,
  s.ends_at AS assinatura_fim,
  s.stripe_customer_id,
  se.origem,
  se.canal_aquisicao,
  se.data_conversao,
  se.ltv,
  se.notas,
  se.tags
FROM public.profiles p
INNER JOIN public.subscriptions s ON s.user_id = p.user_id
LEFT JOIN public.subscriber_extras se ON se.user_id = p.user_id;
