
-- =============================================
-- SPRINT 2 - PARTE 1: FUNDAÇÃO DO BANCO DE DADOS
-- =============================================

-- 1. Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Tabela profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT,
  segment TEXT,
  employee_count TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clientes_updated_at();

-- 3. Tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função has_role com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para atribuir role admin ao primeiro usuario (dono da conta)
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role();

-- 4. Tabela subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'gratuito',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para criar subscription gratuita no signup
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'gratuito', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_subscription();

-- 5. Tabela plan_features
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (plan, module, action)
);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan features"
  ON public.plan_features FOR SELECT
  USING (true);

-- Seed de plan_features
INSERT INTO public.plan_features (plan, module, action, enabled) VALUES
  -- Gratuito: apenas navegar
  ('gratuito', 'financas', 'view', true),
  ('gratuito', 'financas', 'create', false),
  ('gratuito', 'financas', 'export', false),
  ('gratuito', 'rh', 'view', true),
  ('gratuito', 'rh', 'create', false),
  ('gratuito', 'rh', 'export', false),
  ('gratuito', 'marketing', 'view', true),
  ('gratuito', 'marketing', 'create', false),
  ('gratuito', 'marketing', 'export', false),
  ('gratuito', 'projetos', 'view', true),
  ('gratuito', 'projetos', 'create', false),
  ('gratuito', 'projetos', 'export', false),
  ('gratuito', 'clientes', 'view', true),
  ('gratuito', 'clientes', 'create', false),
  ('gratuito', 'clientes', 'export', false),
  ('gratuito', 'clientes', 'ai_analysis', false),
  ('gratuito', 'atividades', 'view', true),
  ('gratuito', 'atividades', 'create', false),
  ('gratuito', 'atividades', 'export', false),
  ('gratuito', 'processos', 'view', true),
  ('gratuito', 'processos', 'create', false),
  ('gratuito', 'processos', 'export', false),
  ('gratuito', 'guia', 'view', true),
  ('gratuito', 'guia', 'create', true),
  -- Plus: criar/editar, sem exportar
  ('plus', 'financas', 'view', true),
  ('plus', 'financas', 'create', true),
  ('plus', 'financas', 'export', false),
  ('plus', 'rh', 'view', true),
  ('plus', 'rh', 'create', true),
  ('plus', 'rh', 'export', false),
  ('plus', 'marketing', 'view', true),
  ('plus', 'marketing', 'create', true),
  ('plus', 'marketing', 'export', false),
  ('plus', 'projetos', 'view', true),
  ('plus', 'projetos', 'create', true),
  ('plus', 'projetos', 'export', false),
  ('plus', 'clientes', 'view', true),
  ('plus', 'clientes', 'create', true),
  ('plus', 'clientes', 'export', false),
  ('plus', 'clientes', 'ai_analysis', false),
  ('plus', 'atividades', 'view', true),
  ('plus', 'atividades', 'create', true),
  ('plus', 'atividades', 'export', false),
  ('plus', 'processos', 'view', true),
  ('plus', 'processos', 'create', true),
  ('plus', 'processos', 'export', false),
  ('plus', 'guia', 'view', true),
  ('plus', 'guia', 'create', true),
  -- Pro: tudo + exportar + IA
  ('pro', 'financas', 'view', true),
  ('pro', 'financas', 'create', true),
  ('pro', 'financas', 'export', true),
  ('pro', 'rh', 'view', true),
  ('pro', 'rh', 'create', true),
  ('pro', 'rh', 'export', true),
  ('pro', 'marketing', 'view', true),
  ('pro', 'marketing', 'create', true),
  ('pro', 'marketing', 'export', true),
  ('pro', 'projetos', 'view', true),
  ('pro', 'projetos', 'create', true),
  ('pro', 'projetos', 'export', true),
  ('pro', 'clientes', 'view', true),
  ('pro', 'clientes', 'create', true),
  ('pro', 'clientes', 'export', true),
  ('pro', 'clientes', 'ai_analysis', true),
  ('pro', 'atividades', 'view', true),
  ('pro', 'atividades', 'create', true),
  ('pro', 'atividades', 'export', true),
  ('pro', 'processos', 'view', true),
  ('pro', 'processos', 'create', true),
  ('pro', 'processos', 'export', true),
  ('pro', 'guia', 'view', true),
  ('pro', 'guia', 'create', true),
  -- Enterprise: tudo + API
  ('enterprise', 'financas', 'view', true),
  ('enterprise', 'financas', 'create', true),
  ('enterprise', 'financas', 'export', true),
  ('enterprise', 'financas', 'api', true),
  ('enterprise', 'rh', 'view', true),
  ('enterprise', 'rh', 'create', true),
  ('enterprise', 'rh', 'export', true),
  ('enterprise', 'rh', 'api', true),
  ('enterprise', 'marketing', 'view', true),
  ('enterprise', 'marketing', 'create', true),
  ('enterprise', 'marketing', 'export', true),
  ('enterprise', 'marketing', 'api', true),
  ('enterprise', 'projetos', 'view', true),
  ('enterprise', 'projetos', 'create', true),
  ('enterprise', 'projetos', 'export', true),
  ('enterprise', 'projetos', 'api', true),
  ('enterprise', 'clientes', 'view', true),
  ('enterprise', 'clientes', 'create', true),
  ('enterprise', 'clientes', 'export', true),
  ('enterprise', 'clientes', 'ai_analysis', true),
  ('enterprise', 'clientes', 'api', true),
  ('enterprise', 'atividades', 'view', true),
  ('enterprise', 'atividades', 'create', true),
  ('enterprise', 'atividades', 'export', true),
  ('enterprise', 'atividades', 'api', true),
  ('enterprise', 'processos', 'view', true),
  ('enterprise', 'processos', 'create', true),
  ('enterprise', 'processos', 'export', true),
  ('enterprise', 'processos', 'api', true),
  ('enterprise', 'guia', 'view', true),
  ('enterprise', 'guia', 'create', true);

-- 6. Tabela team_members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_email TEXT NOT NULL,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, member_email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their team"
  ON public.team_members FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Members can view their membership"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = member_user_id);

-- 7. Tabela team_member_permissions
CREATE TABLE public.team_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  page_slug TEXT NOT NULL,
  UNIQUE (team_member_id, page_slug)
);

ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage team permissions"
  ON public.team_member_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.id = team_member_id AND tm.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.id = team_member_id AND tm.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view own permissions"
  ON public.team_member_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.id = team_member_id AND tm.member_user_id = auth.uid()
    )
  );

-- 8. Tabela support_tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. Tabela invite_tokens
CREATE TABLE public.invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage invite tokens"
  ON public.invite_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.id = team_member_id AND tm.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.id = team_member_id AND tm.owner_id = auth.uid()
    )
  );

-- Função para vincular dados órfãos ao primeiro admin que fizer login
CREATE OR REPLACE FUNCTION public.claim_orphan_clients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clientes
  SET user_id = NEW.user_id
  WHERE user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Trigger: quando o primeiro profile é criado, vincula clientes órfãos
CREATE TRIGGER on_first_profile_claim_orphans
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_orphan_clients();
