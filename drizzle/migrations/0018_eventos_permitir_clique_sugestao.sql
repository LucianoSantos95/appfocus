DROP POLICY IF EXISTS eventos_insert_validated ON public.eventos;
CREATE POLICY eventos_insert_validated ON public.eventos FOR INSERT TO anon, authenticated
WITH CHECK (
  tipo = ANY (ARRAY['visita_catalogo','clique_produto','lead_enviado','clique_sugestao'])
  AND (produto IS NULL OR (length(produto) BETWEEN 1 AND 80 AND produto ~ '^[A-Za-z0-9._\-]+$'))
  AND (sessao IS NULL OR (length(sessao) BETWEEN 1 AND 64 AND sessao ~ '^[A-Za-z0-9._\-]+$'))
);