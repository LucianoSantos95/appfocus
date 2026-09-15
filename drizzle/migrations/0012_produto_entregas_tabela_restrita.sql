-- PostgREST não aceita select=* com grants por coluna; o link de entrega
-- passa a viver em tabela própria, invisível para o público.
GRANT SELECT ON public.produtos TO anon;

CREATE TABLE public.produto_entregas (
  produto_slug text PRIMARY KEY,
  link text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.produto_entregas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_entregas TO authenticated;

ALTER TABLE public.produto_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia entregas"
  ON public.produto_entregas FOR ALL TO authenticated
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE TRIGGER trg_produto_entregas_updated_at
  BEFORE UPDATE ON public.produto_entregas
  FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();

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
    CASE WHEN c.status = 'pago' THEN COALESCE(e.link, p.link_destino) END AS link_entrega,
    c.created_at
  FROM public.compras c
  LEFT JOIN public.produtos p ON p.slug = c.produto_slug
  LEFT JOIN public.produto_entregas e ON e.produto_slug = c.produto_slug
  WHERE c.token_acesso = p_token
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.compra_por_token(text) TO anon, authenticated;