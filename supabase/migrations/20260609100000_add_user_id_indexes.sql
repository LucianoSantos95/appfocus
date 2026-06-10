-- Indexes on user_id for all core tables.
-- RLS policies filter on auth.uid() = user_id; without an index every query
-- does a sequential scan. These eight indexes make that lookup O(log n).

CREATE INDEX IF NOT EXISTS idx_transacoes_user_id    ON public.transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id      ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON public.colaboradores(user_id);
CREATE INDEX IF NOT EXISTS idx_projetos_user_id      ON public.projetos(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_user_id       ON public.tarefas(user_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_user_id     ON public.campanhas(user_id);
CREATE INDEX IF NOT EXISTS idx_processos_user_id     ON public.processos(user_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_user_id     ON public.conteudos(user_id);
