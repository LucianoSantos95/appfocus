DROP TABLE IF EXISTS
 public.campanha_clientes, public.campanhas, public.conteudos,
 public.client_recordings, public.clientes,
 public.transacoes, public.contas_bancarias,
 public.tarefas, public.projetos, public.processos, public.colaboradores,
 public.agenda_items, public.bulletin_notes,
 public.relatorio_contatos, public.relatorios_enviados, public.import_history,
 public.onboarding_sessions, public.onboarding_progress,
 public.user_milestones, public.user_daily_activity, public.user_funnel_stage,
 public.user_sessions, public.user_preferences, public.whatsapp_preferences,
 public.user_integrations, public.sales_touchpoints,
 public.subscriber_extras, public.subscriber_followups, public.email_automation_log,
 public.invite_tokens, public.team_member_permissions, public.team_members,
 public.referrals, public.cancellation_feedback, public.data_export_requests,
 public.plan_change_history, public.stripe_webhook_events
CASCADE;

DROP FUNCTION IF EXISTS public.claim_orphan_clients() CASCADE;
DROP FUNCTION IF EXISTS public.populate_demo_data() CASCADE;
DROP FUNCTION IF EXISTS public.update_clientes_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.init_funnel_stage() CASCADE;
DROP FUNCTION IF EXISTS public.recompute_funnel_stage(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.sync_funnel_from_subscription() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_engagement() CASCADE;
DROP FUNCTION IF EXISTS public.owner_users_list() CASCADE;
DROP FUNCTION IF EXISTS public.owner_users_overview() CASCADE;
DROP FUNCTION IF EXISTS public.get_integration_tokens(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_integration_access_token(uuid, text, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_integration(uuid, text, text, text, timestamptz, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.enforce_paid_plan_for_exports() CASCADE;
DROP FUNCTION IF EXISTS public.record_signup_milestone() CASCADE;
DROP TYPE IF EXISTS public.funnel_stage CASCADE;