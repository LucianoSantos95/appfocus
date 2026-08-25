# Limpeza do banco + identidade visual do Hub Central

## 1. Enxugar o banco (de ~56 para o essencial)

### Fica (usado hoje)
- Catálogo público: `produtos`, `eventos`, `leads`, `feedbacks`, `support_tickets`
- Login e admin (necessários para você entrar em `/auth` e `/admin`): `profiles`, `user_roles`, `subscriptions`, `plan_features`, `login_attempts`, `rate_limits`, `consent_records`, `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`, `notifications`, `audit_log`, `client_errors`

### Sai (tabelas dos módulos que já tiramos do ar)
`clientes`, `transacoes`, `contas_bancarias`, `tarefas`, `projetos`, `processos`, `colaboradores`, `campanhas`, `campanha_clientes`, `conteudos`, `agenda_items`, `bulletin_notes`, `client_recordings`, `relatorio_contatos`, `relatorios_enviados`, `import_history`, `onboarding_sessions`, `onboarding_progress`, `user_milestones`, `user_daily_activity`, `user_funnel_stage`, `user_sessions`, `user_preferences`, `whatsapp_preferences`, `user_integrations`, `sales_touchpoints`, `subscriber_extras`, `subscriber_followups`, `email_automation_log`, `team_members`, `team_member_permissions`, `invite_tokens`, `referrals`, `cancellation_feedback`, `data_export_requests`, `plan_change_history`, `stripe_webhook_events` — mais as views e funções que dependem só delas.

Junto com isso, para o app não quebrar:
- Remoção das edge functions órfãs: `analyze-client`, `analyze-competitor`, `enrich-client`, `google-integration`, `hub-assistant`, `onboarding-assistant`, `transcribe-meeting`, `smart-import-financeiro`, `send-bi-report`, `send-whatsapp`, `whatsapp-scheduler`, `notify-slack`, `mcp`, `send-invite`, `subscriber-followup`, `send-followup-email`, e os `cron-*` (com o agendamento correspondente desligado).
- Remoção dos componentes que só liam essas tabelas (gestão de equipe no menu, integrações, WhatsApp, contexto de permissões de time).
- `AdminPanel` (colaboradores) sai do menu do usuário, já que a base de equipe deixa de existir.

Atenção: isso apaga os dados dessas tabelas em definitivo. Faço um export CSV de tudo antes de derrubar, guardado como arquivo do projeto, para você ter o histórico.

## 2. Nome "Hub Central" e plano de fundo

**Nome/marca:** hoje o nome só aparece no hover do logo, então na prática a home fica sem assinatura. Proposta:
- Logo centralizado + wordmark "HUB CENTRAL" sempre visível abaixo dele, em Montserrat Alternates, caixa alta, letter-spacing largo, tamanho contido — a marca aparece sem competir com o título da página.
- Micro-animação de entrada: as duas palavras deslizam de trás do logo uma única vez ao carregar (e repetem no hover), em vez de só existirem no hover.

**Fundo animado** (referências: Linear, Vercel, Stripe — o que se repete nos melhores sites dark de 2025/26):
- Camada 1 — grade sutil já existente, agora com deriva lenta (~60s) quase imperceptível.
- Camada 2 — "aurora": duas ou três manchas de azul elétrico bem difusas atrás do herói, respirando em 18-24s, em CSS puro (sem canvas, sem impacto de performance).
- Camada 3 — spotlight que segue o mouse no topo da página, iluminando levemente a grade.
- Camada 4 — grão/ruído estático de baixíssima opacidade, para tirar o aspecto "gradiente plástico".
- Tudo respeita `prefers-reduced-motion` e tem versão calibrada para o tema claro.

## 3. Feedback sempre visível
- Botão flutuante fixo em toda a página, com fundo sólido de acento (não translúcido) e sombra, para não sumir sobre imagens ou no tema claro.
- Rótulo "Deixe seu feedback" expandido nos primeiros segundos e ao passar o mouse; recolhe para o ícone depois, sem nunca desaparecer.
- Mantém o link no rodapé e ganha uma faixa discreta no fim do catálogo ("Este Hub é um MVP — o que você diria pra melhorar?") com o mesmo formulário.
- Some apenas enquanto o próprio formulário estiver aberto.

## Detalhes técnicos
- Migração única com `DROP TABLE ... CASCADE` na lista acima + drop das funções/triggers órfãs; export prévio via consulta e arquivo em `docs/backup-*.csv`.
- Fundo: novo `src/components/central/FundoAnimado.tsx` + keyframes em `index.css` (`aurora-drift`, `grid-drift`), spotlight via variável CSS atualizada no `pointermove`.
- Marca: ajuste no header de `src/pages/Central.tsx`, wordmark com `font-brand`.
- Feedback: `BotaoFeedback.tsx` com estado expandido/recolhido e nova faixa antes do FAQ.
