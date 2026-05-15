
# Plano: Foco em Agências — Marketing, Projetos, Clientes + Higiene de Dados

Olhar analítico sobre o que já existe. Não vamos reinventar — só preencher as lacunas que travam uma agência no dia a dia.

---

## 1. Clientes — Gravação de Reunião + 2 ganhos rápidos

### 1.1 Botão "Gravar Áudio da Reunião" (essencial)
Dentro do popup de detalhes do cliente, ao lado do `MeetingNotesEditor`:
- Botão "🎙️ Gravar reunião" que abre um painel com:
  - Timer ao vivo + waveform simples
  - Pausar / Parar
- Ao parar:
  - Upload do .webm para um novo bucket `client-recordings` (privado, RLS por user_id na pasta)
  - Edge function `transcribe-meeting` envia para o **Lovable AI Gateway** (`google/gemini-2.5-pro` aceita áudio) e devolve:
    - Transcrição completa
    - Resumo executivo (3-5 bullets)
    - Próximos passos sugeridos (vai direto para `proxima_acao_sugerida` do cliente)
  - Tudo é anexado ao `meeting_notes` do cliente com data e link do áudio
- Nova tabela `client_recordings` (cliente_id, audio_url, transcript, summary, duration_sec, created_at)

### 1.2 Pipeline visual de prospects (Kanban)
Hoje só temos lista filtrada. Adicionar uma view Kanban com colunas = `status` (prospecto → contato → proposta → negociação → ativo → perdido). Drag-and-drop atualiza status. Reaproveita `useClientes`.

### 1.3 Histórico unificado por cliente
Aba "Linha do tempo" no popup do cliente já agregando: reuniões gravadas, projetos vinculados, transações, tarefas. Tudo com query simples nos hooks existentes — só montar a UI.

---

## 2. Projetos — 3 essenciais para agência

### 2.1 Visão Kanban por status
Mesma lógica do item 1.2, aplicada ao módulo Projetos. Hoje é só tabela/cards — agência precisa de board.

### 2.2 Vincular Cliente ao Projeto
Adicionar coluna `cliente_id` em `projetos` (FK lógica para `clientes`). Permite:
- Filtrar projetos por cliente no popup do cliente (item 1.3)
- Calcular **rentabilidade real**: `budget` do projeto vs. soma de transações do cliente vinculado

### 2.3 Margem do Projeto (KPI)
Card simples no detalhe do projeto: Receita do cliente vinculado − despesas com `category` ligada ao projeto. Sem inventar tabela nova — só agrega dados de `transacoes`.

---

## 3. Marketing — 2 essenciais

### 3.1 Resultado da Campanha (campos de performance)
Adicionar à tabela `campanhas`:
- `leads_gerados` (int)
- `conversoes` (int)
- `receita_atribuida` (numeric)

Com isso o **ROI por campanha** (já planejado no `.lovable/plan.md`) sai de "N/A" para real: `(receita_atribuida − budget) / budget`. Mostrar no `MarketingBIPanel`.

### 3.2 Aprovação de Conteúdo (workflow)
Adicionar a `conteudos`:
- `approval_status` (pendente / aprovado / ajustar)
- `feedback` (text)

Botões "Aprovar / Solicitar ajuste" no `ContentCalendar`. É o fluxo crítico de agência com cliente — sem isso, conteúdo vira email/WhatsApp solto.

---

## 4. Limpeza de Bases (auditoria)

Levantamento real do banco (38 tabelas, contagem de linhas):

**Manter como está** — em uso ativo:
`transacoes`, `tarefas`, `processos`, `clientes`, `projetos`, `agenda_items`, `colaboradores`, `conteudos`, `bulletin_notes`, `subscriptions`, `user_roles`, `user_milestones`, `profiles`, `campanhas`, `contas_bancarias`, `feedbacks`, `onboarding_sessions`, `onboarding_progress`, `relatorios_enviados`, `rate_limits`, `support_tickets`, `import_history`, `whatsapp_preferences`, `audit_log`, `plan_features`, `login_attempts`, `email_send_state`.

**Em uso mas vazias** (manter, infraestrutura):
`notifications`, `team_members`, `team_member_permissions`, `invite_tokens`, `user_integrations`, `subscriber_extras`, `email_send_log`, `email_unsubscribe_tokens`, `suppressed_emails`, `relatorio_contatos`.

**Candidatas a remover** (vazias + sem referências significativas no app):
- `campanha_clientes` — 1 linha, foi planejado mas não há UI consumindo. Vinculação cliente↔campanha pode ficar via `clientes.id` na própria campanha futuramente. **Remover.**

> Conclusão: a base está enxuta. Não há lixo escondido, só uma tabela órfã. Vou removê-la na implementação.

---

## 5. Métrica de Retenção — Usuários que mais voltam

Já temos `audit_log` (657 linhas) registrando ações por `user_id`. Vamos transformar em base de retenção sem criar dados duplicados.

### 5.1 View `vw_user_engagement` (SQL view)
Agrega de `audit_log`:
- `user_id`, `display_name` (join `profiles`), `email`
- `total_actions` (90d)
- `active_days_30d` — quantos dias distintos com atividade nos últimos 30
- `last_active_at`
- `first_seen_at`
- `actions_by_module` (jsonb)
- Classificação: **Power user** (≥15 dias ativos/30), **Recorrente** (5-14), **Casual** (1-4), **Inativo** (0 nos últimos 30d)

RLS: só admin (`has_role(auth.uid(), 'admin')`).

### 5.2 Tab "Engajamento" no Admin Panel
Tabela ordenável por `active_days_30d` desc, com badges de classificação, gráfico de barras top 10 e filtro por plano. Reaproveita `AdminPanel.tsx`.

### 5.3 (Opcional, mesma fase) Cohort de Retenção
Gráfico simples: % de usuários cadastrados na semana X que voltaram nas semanas X+1, X+2, X+3, X+4. Calculado a partir de `profiles.created_at` + `audit_log`.

---

## 6. Ordem de Execução Sugerida

1. **Limpeza** (`campanha_clientes`) + **view de engajamento** + tab admin → migração rápida, valor imediato
2. **Gravação de reunião** (bucket + edge function `transcribe-meeting` + UI) — maior impacto pedido
3. **Projetos**: cliente_id + Kanban + KPI margem
4. **Marketing**: campos de performance + ROI no BI
5. **Aprovação de conteúdo** no ContentCalendar
6. **Pipeline Kanban de clientes** + linha do tempo unificada

---

## 7. Tabela de Mudanças

| Arquivo / Tabela | Ação |
|---|---|
| `client_recordings` (tabela) | Criar (cliente_id, audio_url, transcript, summary, duration_sec) |
| Bucket `client-recordings` | Criar (privado, RLS por user_id) |
| `supabase/functions/transcribe-meeting/index.ts` | Criar — usa Lovable AI Gateway |
| `src/components/clientes/MeetingRecorder.tsx` | Criar |
| `src/components/clientes/MeetingNotesEditor.tsx` | Integrar botão de gravação |
| `src/components/clientes/ClientesKanban.tsx` | Criar |
| `projetos.cliente_id` | Adicionar coluna |
| `src/components/projetos/ProjetosKanban.tsx` | Criar |
| `src/components/projetos/ProjetoMargemCard.tsx` | Criar |
| `campanhas` (leads_gerados, conversoes, receita_atribuida) | Adicionar colunas |
| `src/components/bi/MarketingBIPanel.tsx` | Mostrar ROI real |
| `conteudos` (approval_status, feedback) | Adicionar colunas |
| `src/components/marketing/ContentCalendar.tsx` | Botões de aprovação |
| Tabela `campanha_clientes` | **Drop** |
| View `vw_user_engagement` | Criar (admin-only) |
| `src/components/user/AdminPanel.tsx` | Nova aba "Engajamento" |

---

Pronto para implementar quando aprovar — posso fazer tudo numa sequência ou começar só pelos itens 1, 4 e 5 (gravação + limpeza + retenção) se quiser priorizar o WOW + higiene primeiro.
