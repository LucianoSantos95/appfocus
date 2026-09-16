CREATE OR REPLACE FUNCTION public.compra_por_token(p_token text)
 RETURNS TABLE(produto_nome text, produto_slug text, status text, nome text, link_entrega text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(c.produto_nome, p.nome) AS produto_nome,
    c.produto_slug,
    c.status,
    c.nome,
    CASE WHEN c.status = 'pago' THEN e.link END AS link_entrega,
    c.created_at
  FROM public.compras c
  LEFT JOIN public.produtos p ON p.slug = c.produto_slug
  LEFT JOIN public.produto_entregas e ON e.produto_slug = c.produto_slug
  WHERE c.token_acesso = p_token
  LIMIT 1
$function$;