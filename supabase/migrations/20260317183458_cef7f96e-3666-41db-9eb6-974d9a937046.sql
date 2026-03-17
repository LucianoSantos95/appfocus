
-- Function to populate demo data for new users
CREATE OR REPLACE FUNCTION public.populate_demo_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := NEW.user_id;
BEGIN
  -- Contas bancárias (2)
  INSERT INTO public.contas_bancarias (user_id, name, institution, type, balance) VALUES
    (uid, 'Conta Principal', 'Banco do Brasil', 'corrente', 15420.50),
    (uid, 'Conta Poupança', 'Nubank', 'poupanca', 8300.00);

  -- Transações (3)
  INSERT INTO public.transacoes (user_id, description, value, type, category, status, date, payment_method, client) VALUES
    (uid, 'Projeto de consultoria', 4500.00, 'receita', 'Serviços', 'confirmado', CURRENT_DATE - interval '5 days', 'Transferência', 'Empresa ABC'),
    (uid, 'Aluguel do escritório', 2200.00, 'despesa', 'Infraestrutura', 'confirmado', CURRENT_DATE - interval '2 days', 'Boleto', NULL),
    (uid, 'Venda de produto digital', 1890.00, 'receita', 'Produtos', 'pendente', CURRENT_DATE + interval '3 days', 'Pix', 'João Mendes');

  -- Colaboradores (3)
  INSERT INTO public.colaboradores (user_id, name, role, department, email, phone, status, salary, start_date) VALUES
    (uid, 'Ana Costa', 'Gerente de Projetos', 'Operações', 'ana.costa@exemplo.com', '(11) 98765-4321', 'ativo', 6500.00, CURRENT_DATE - interval '1 year'),
    (uid, 'Carlos Oliveira', 'Desenvolvedor', 'Tecnologia', 'carlos.oliveira@exemplo.com', '(11) 91234-5678', 'ativo', 5200.00, CURRENT_DATE - interval '6 months'),
    (uid, 'Mariana Santos', 'Analista de Marketing', 'Marketing', 'mariana.santos@exemplo.com', '(21) 99876-5432', 'ativo', 4800.00, CURRENT_DATE - interval '3 months');

  -- Campanhas (2)
  INSERT INTO public.campanhas (user_id, name, objective, platforms, status, budget, start_date, end_date, responsible) VALUES
    (uid, 'Lançamento Produto X', 'Gerar leads qualificados', 'Instagram, Google Ads', 'ativa', 3500.00, CURRENT_DATE - interval '10 days', CURRENT_DATE + interval '20 days', 'Mariana Santos'),
    (uid, 'Black Friday 2026', 'Aumentar vendas em 30%', 'Facebook, E-mail', 'planejamento', 5000.00, CURRENT_DATE + interval '30 days', CURRENT_DATE + interval '45 days', 'Ana Costa');

  -- Conteúdos (2)
  INSERT INTO public.conteudos (user_id, title, description, platform, status, scheduled_date) VALUES
    (uid, 'Post: 5 dicas de produtividade', 'Carrossel com dicas práticas para PMEs', 'Instagram', 'agendado', CURRENT_DATE + interval '2 days'),
    (uid, 'E-mail: Newsletter semanal', 'Resumo das novidades e promoções', 'E-mail', 'rascunho', CURRENT_DATE + interval '5 days');

  -- Projetos (3)
  INSERT INTO public.projetos (user_id, name, description, status, priority, responsible, budget, start_date, end_date) VALUES
    (uid, 'Redesign do Site', 'Modernizar o site institucional com novo layout', 'em_andamento', 'alta', 'Carlos Oliveira', 12000.00, CURRENT_DATE - interval '15 days', CURRENT_DATE + interval '45 days'),
    (uid, 'App Mobile MVP', 'Desenvolver versão mínima do aplicativo', 'planejamento', 'media', 'Carlos Oliveira', 25000.00, CURRENT_DATE + interval '10 days', CURRENT_DATE + interval '90 days'),
    (uid, 'Automação de Processos', 'Automatizar fluxos internos repetitivos', 'em_andamento', 'alta', 'Ana Costa', 8000.00, CURRENT_DATE - interval '7 days', CURRENT_DATE + interval '30 days');

  -- Clientes (3)
  INSERT INTO public.clientes (user_id, nome, email, telefone, empresa, segmento, status, tipo_contrato, valor_total, potencial) VALUES
    (uid, 'Fernando Almeida', 'fernando@empresaabc.com', '(11) 97654-3210', 'Empresa ABC', 'Tecnologia', 'ativo', 'mensal', 4500.00, 'alto'),
    (uid, 'Patrícia Lima', 'patricia@startupxyz.com', '(21) 98765-1234', 'Startup XYZ', 'SaaS', 'prospecto', NULL, 0, 'medio'),
    (uid, 'Roberto Dias', 'roberto@comerciork.com', '(31) 99876-5432', 'Comércio RK', 'Varejo', 'ativo', 'anual', 12000.00, 'alto');

  -- Tarefas (3)
  INSERT INTO public.tarefas (user_id, title, description, priority, status, category, responsible, due_date) VALUES
    (uid, 'Revisar proposta comercial', 'Finalizar proposta para o cliente Empresa ABC', 'alta', 'pendente', 'Comercial', 'Ana Costa', CURRENT_DATE + interval '2 days'),
    (uid, 'Atualizar relatório mensal', 'Compilar dados financeiros do mês', 'media', 'em_andamento', 'Financeiro', 'Carlos Oliveira', CURRENT_DATE + interval '5 days'),
    (uid, 'Entrevistar candidato', 'Entrevista técnica para vaga de designer', 'baixa', 'pendente', 'RH', 'Mariana Santos', CURRENT_DATE + interval '3 days');

  -- Processos (2)
  INSERT INTO public.processos (user_id, name, description, department, owner, status) VALUES
    (uid, 'Onboarding de Clientes', 'Fluxo de boas-vindas e ativação de novos clientes', 'Comercial', 'Ana Costa', 'ativo'),
    (uid, 'Aprovação de Despesas', 'Processo de aprovação de gastos acima de R$500', 'Financeiro', 'Carlos Oliveira', 'ativo');

  -- Agenda (3)
  INSERT INTO public.agenda_items (user_id, title, date, time, type, priority) VALUES
    (uid, 'Reunião de alinhamento semanal', CURRENT_DATE + interval '1 day', '09:00', 'meeting', 'high'),
    (uid, 'Call com cliente Empresa ABC', CURRENT_DATE + interval '2 days', '14:00', 'meeting', 'medium'),
    (uid, 'Entrega do relatório mensal', CURRENT_DATE + interval '4 days', '17:00', 'task', 'high');

  -- Mural (2)
  INSERT INTO public.bulletin_notes (user_id, content, author, is_pinned) VALUES
    (uid, 'Bem-vindo ao Focus! Explore os módulos para conhecer todas as funcionalidades. 🚀', 'Focus Hub', true),
    (uid, 'Dica: use o menu lateral para navegar entre os módulos de gestão.', 'Focus Hub', false);

  RETURN NEW;
END;
$$;

-- Trigger on profiles table (created automatically for every new user)
CREATE TRIGGER on_profile_created_populate_demo
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_demo_data();
