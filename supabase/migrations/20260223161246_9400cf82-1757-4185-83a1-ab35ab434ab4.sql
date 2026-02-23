
-- =============================================
-- 1. TRANSACOES (Finanças)
-- =============================================
CREATE TABLE public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  category TEXT,
  type TEXT NOT NULL DEFAULT 'receita',
  status TEXT NOT NULL DEFAULT 'pendente',
  payment_method TEXT,
  client TEXT,
  provider TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own transacoes" ON public.transacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transacoes" ON public.transacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transacoes" ON public.transacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transacoes" ON public.transacoes FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. CONTAS_BANCARIAS (Finanças)
-- =============================================
CREATE TABLE public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  institution TEXT,
  type TEXT NOT NULL DEFAULT 'corrente',
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own contas_bancarias" ON public.contas_bancarias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contas_bancarias" ON public.contas_bancarias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contas_bancarias" ON public.contas_bancarias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contas_bancarias" ON public.contas_bancarias FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. COLABORADORES (RH)
-- =============================================
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  salary NUMERIC,
  start_date DATE,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  manager TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own colaboradores" ON public.colaboradores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own colaboradores" ON public.colaboradores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own colaboradores" ON public.colaboradores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own colaboradores" ON public.colaboradores FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. PROJETOS
-- =============================================
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejamento',
  priority TEXT DEFAULT 'media',
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  responsible TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own projetos" ON public.projetos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projetos" ON public.projetos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projetos" ON public.projetos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projetos" ON public.projetos FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. TAREFAS
-- =============================================
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'pendente',
  category TEXT,
  responsible TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own tarefas" ON public.tarefas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tarefas" ON public.tarefas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tarefas" ON public.tarefas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tarefas" ON public.tarefas FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 6. CAMPANHAS (Marketing)
-- =============================================
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  objective TEXT,
  platforms TEXT,
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planejamento',
  responsible TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own campanhas" ON public.campanhas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campanhas" ON public.campanhas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campanhas" ON public.campanhas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campanhas" ON public.campanhas FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. PROCESSOS
-- =============================================
CREATE TABLE public.processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own processos" ON public.processos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own processos" ON public.processos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own processos" ON public.processos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own processos" ON public.processos FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Updated_at triggers for all tables
-- =============================================
CREATE OR REPLACE FUNCTION public.update_generic_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();
CREATE TRIGGER update_contas_bancarias_updated_at BEFORE UPDATE ON public.contas_bancarias FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();
CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();
CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();
CREATE TRIGGER update_processos_updated_at BEFORE UPDATE ON public.processos FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();
