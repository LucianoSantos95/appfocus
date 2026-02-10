
-- 1. Adicionar user_id na tabela clientes
ALTER TABLE public.clientes ADD COLUMN user_id UUID DEFAULT auth.uid();

-- 2. Remover politicas antigas
DROP POLICY "Authenticated users can read clientes" ON public.clientes;
DROP POLICY "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY "Authenticated users can update clientes" ON public.clientes;
DROP POLICY "Authenticated users can delete clientes" ON public.clientes;

-- 3. Criar novas politicas baseadas em ownership
CREATE POLICY "Users can read own clientes"
  ON public.clientes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes"
  ON public.clientes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes"
  ON public.clientes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Feedbacks: permitir delete pelo autor (por email)
CREATE POLICY "Authors can delete own feedbacks"
  ON public.feedbacks FOR DELETE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
