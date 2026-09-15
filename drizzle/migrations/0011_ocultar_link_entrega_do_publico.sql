-- O catálogo é lido por anon com select *; o link de entrega não pode vazar.
REVOKE SELECT ON public.produtos FROM anon;
GRANT SELECT (
  id, slug, nome, descricao, tipo, gratuito, preco, link_destino, captura_lead,
  emoji, ordem, ativo, destaque, created_at, imagens, capa, detalhes, downloads,
  arquivado, destaque_temporario_ate
) ON public.produtos TO anon;