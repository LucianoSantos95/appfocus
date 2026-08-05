DROP POLICY "Users can update own clientes" ON public.clientes;
CREATE POLICY "Users can update own clientes" ON public.clientes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own colaboradores" ON public.colaboradores;
CREATE POLICY "Users can update own colaboradores" ON public.colaboradores FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own projetos" ON public.projetos;
CREATE POLICY "Users can update own projetos" ON public.projetos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own tarefas" ON public.tarefas;
CREATE POLICY "Users can update own tarefas" ON public.tarefas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own campanhas" ON public.campanhas;
CREATE POLICY "Users can update own campanhas" ON public.campanhas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own processos" ON public.processos;
CREATE POLICY "Users can update own processos" ON public.processos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own agenda_items" ON public.agenda_items;
CREATE POLICY "Users can update own agenda_items" ON public.agenda_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own bulletin_notes" ON public.bulletin_notes;
CREATE POLICY "Users can update own bulletin_notes" ON public.bulletin_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own conteudos" ON public.conteudos;
CREATE POLICY "Users can update own conteudos" ON public.conteudos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users update own recordings" ON public.client_recordings;
CREATE POLICY "Users update own recordings" ON public.client_recordings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Users can update own contas_bancarias" ON public.contas_bancarias FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own transacoes" ON public.transacoes;
CREATE POLICY "Users can update own transacoes" ON public.transacoes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    bank_account_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.contas_bancarias c
      WHERE c.id = bank_account_id AND c.user_id = auth.uid()
    )
  )
);

DROP POLICY "Users can insert own transacoes" ON public.transacoes;
CREATE POLICY "Users can insert own transacoes" ON public.transacoes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    bank_account_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.contas_bancarias c
      WHERE c.id = bank_account_id AND c.user_id = auth.uid()
    )
  )
);