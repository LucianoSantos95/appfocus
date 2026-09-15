-- Entrega pós-pagamento: link revelado só depois da compra confirmada
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS link_entrega text;

CREATE TABLE public.compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_slug text NOT NULL,
  produto_nome text,
  nome text NOT NULL,
  email text NOT NULL,
  valor numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  billing_type text,
  asaas_payment_id text,
  asaas_checkout_id text,
  token_acesso text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  liberado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX compras_token_acesso_key ON public.compras (token_acesso);
CREATE INDEX compras_email_idx ON public.compras (email);
CREATE INDEX compras_produto_idx ON public.compras (produto_slug);
CREATE INDEX compras_payment_idx ON public.compras (asaas_payment_id);

GRANT ALL ON public.compras TO service_role;
GRANT SELECT ON public.compras TO authenticated;

ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono da plataforma lê compras"
  ON public.compras FOR SELECT TO authenticated
  USING (public.is_platform_owner());

CREATE TRIGGER trg_compras_updated_at
  BEFORE UPDATE ON public.compras
  FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();

-- Consulta pública por token: devolve só o necessário e o link apenas se pago.
CREATE OR REPLACE FUNCTION public.compra_por_token(p_token text)
RETURNS TABLE (
  produto_nome text,
  produto_slug text,
  status text,
  nome text,
  link_entrega text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(c.produto_nome, p.nome) AS produto_nome,
    c.produto_slug,
    c.status,
    c.nome,
    CASE WHEN c.status = 'pago' THEN COALESCE(p.link_entrega, p.link_destino) END AS link_entrega,
    c.created_at
  FROM public.compras c
  LEFT JOIN public.produtos p ON p.slug = c.produto_slug
  WHERE c.token_acesso = p_token
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.compra_por_token(text) TO anon, authenticated;