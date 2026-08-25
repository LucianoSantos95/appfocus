CREATE SCHEMA IF NOT EXISTS arquivo;
REVOKE ALL ON SCHEMA arquivo FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS arquivo.backup_2026_08 (
  tabela text primary key,
  linhas integer not null,
  dados jsonb not null,
  criado_em timestamptz not null default now()
);

DO $$
DECLARE t text;
DECLARE alvos text[] := ARRAY[
 'clientes','transacoes','contas_bancarias','tarefas','projetos','processos','colaboradores',
 'campanhas','campanha_clientes','conteudos','agenda_items','bulletin_notes','client_recordings',
 'relatorio_contatos','relatorios_enviados','import_history','onboarding_sessions','onboarding_progress',
 'user_milestones','user_daily_activity','user_funnel_stage','user_sessions','user_preferences',
 'whatsapp_preferences','user_integrations','sales_touchpoints','subscriber_extras','subscriber_followups',
 'email_automation_log','team_members','team_member_permissions','invite_tokens','referrals',
 'cancellation_feedback','data_export_requests','plan_change_history','stripe_webhook_events'];
BEGIN
  FOREACH t IN ARRAY alvos LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format(
        'INSERT INTO arquivo.backup_2026_08 (tabela, linhas, dados)
         SELECT %L, count(*)::int, coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) FROM public.%I x
         ON CONFLICT (tabela) DO UPDATE SET linhas = excluded.linhas, dados = excluded.dados, criado_em = now()',
        t, t);
    END IF;
  END LOOP;
END $$;