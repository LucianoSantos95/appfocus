## Objetivo

Substituir o follow-up manual por duas automações:

1. **Sequência de reengajamento de onboarding** — 3 toques (D+1, D+3, D+7) para quem não terminou o onboarding, com gatilhos psicológicos diferentes em cada e-mail.
2. **Digest semanal de upgrade** — 1 e-mail por semana para usuários do plano gratuito que mais usam a plataforma, baseado em score combinado (logins + registros + módulos).

Tudo via a infra de e-mails já instalada (Lovable Emails / fila pgmq + React Email + cron), sem Resend, sem novos provedores.

## Avaliação do prompt que você compartilhou

- ✅ Lógica de detecção via `onboarding_sessions.completed_at` está certa.
- ❌ Resend é desnecessário e quebraria SPF/DKIM do `notify.focusinteligente.com.br`. Usamos a infra interna.
- ❌ "1 e-mail só por usuário" mata a estratégia. Você mesmo pediu cadência a cada 3 dias.
- ❌ Novo overlay `OnboardingGuide` duplica `OnboardingPrompt` + `OnboardingCouponBanner` já existentes. Vamos só melhorar a copy/CTA dos atuais.
- ✅ Personalização por `segment` e `priority_pain` é boa — mantida.
- ⚠️ Unsubscribe/suppression é tratado automaticamente pela infra atual (sem código extra).

## O que vai ser construído

### 1) Schema (migration)

Tabela nova `email_automation_log` para idempotência e relatórios:
- `user_id`, `automation_type` (`onboarding_reengagement` | `power_user_upgrade`), `sequence_step` (int), `template_name`, `sent_at`, `metadata` (jsonb)
- Índice composto `(user_id, automation_type, sequence_step)` único — impede envio duplicado da mesma etapa.
- RLS: apenas admin lê; insert via service_role (edge functions).

Coluna em `onboarding_sessions`:
- `last_reengagement_step int default 0` (para saber em qual toque o usuário está, evita query pesada no log).

### 2) Templates React Email (3 + 1 = 4 templates)

Em `supabase/functions/_shared/transactional-email-templates/`:

**Sequência de onboarding** — copy diferente por etapa, usando gatilhos psicológicos distintos:
- `onboarding-reengagement-d1.tsx` — **Gatilho: continuidade / Zeigarnik**. "Você está a 3 cliques do seu cupom" — mostra progresso visual (X/3 módulos), botão "Continuar de onde parou".
- `onboarding-reengagement-d3.tsx` — **Gatilho: prova social + escassez**. "Centenas de operações já estão rodando no Hub — não fique de fora. Cupom de 20% expira em 5 dias."
- `onboarding-reengagement-d7.tsx` — **Gatilho: perda + última chance**. "Esta é nossa última mensagem. Seu cupom de 20% será cancelado em 48h." (último envio — não insiste mais)

**Power users**:
- `power-user-upgrade-digest.tsx` — Personalizado: "Você criou X clientes, Y projetos e Z tarefas esta semana — sua operação está crescendo. Hora de remover os limites." CTA para `/planos`. Footer mostra qual limite ele está mais perto de bater.

Todos registrados em `registry.ts`. Cada template recebe props (nome, segmento, contadores, link com cupom já aplicado).

### 3) Edge Functions

Duas novas, ambas chamando `send-transactional-email` internamente (não enviam direto):

**`onboarding-reengagement-cron`** (roda 1x/dia às 10h BRT)
- Busca `onboarding_sessions` onde `completed_at IS NULL`, faz join com `auth.users` para pegar `email` e `created_at`.
- Para cada usuário, calcula dias desde signup:
  - 1 dia + `last_reengagement_step = 0` → envia D+1
  - 3 dias + `last_reengagement_step = 1` → envia D+3
  - 7 dias + `last_reengagement_step = 2` → envia D+7
- Confere `email_automation_log` para garantir idempotência.
- Invoca `send-transactional-email` com `idempotencyKey = onb-reeng-{user_id}-{step}`.
- Atualiza `onboarding_sessions.last_reengagement_step` e insere em `email_automation_log`.
- Respeita `suppressed_emails` (já feito automaticamente pelo sender).

**`power-user-upgrade-cron`** (roda 1x/semana, segunda às 11h BRT)
- Query: usuários com `subscriptions.plan = 'gratuito'` e `status = 'active'`.
- Para cada um, calcula **score** dos últimos 14 dias:
  - `logins` = count distinct dias de `last_sign_in_at` (proxy via `auth.users`)
  - `registros` = soma de inserts em `clientes` + `projetos` + `tarefas` + `transacoes` (created_at >= now() - 14d)
  - `modulos_ativos` = quantos desses 4 módulos têm ≥1 item
  - `score = logins*2 + registros + modulos_ativos*5`
- Top users com `score >= 15` recebem o e-mail (corte ajustável).
- Idempotência semanal: chave `power-up-{user_id}-{ano-semana}` impede duplicidade.
- Skip usuários já em `suppressed_emails` ou que estão a <7d do signup (não maduro).

Ambas usam o cupom `FOCUS20` que já existe no fluxo de onboarding.

### 4) Agendamento (pg_cron via supabase--insert)

```text
onboarding-reengagement-cron → 0 13 * * *   (10h BRT diário)
power-user-upgrade-cron      → 0 14 * * 1   (11h BRT segundas)
```

Usa `net.http_post` com o anon key (mesmo padrão dos crons já existentes).

### 5) Frontend — ajustes mínimos (não cria componente novo)

Apenas refina o que existe:
- `OnboardingPrompt.tsx` — adiciona variação de copy baseada em `priority_pain` e `current_step` (igual lógica do prompt original, mas dentro do componente atual).
- `OnboardingCouponBanner.tsx` — verifica se o cupom ainda está válido (`coupon_expires_at`) e esconde quando expira.
- Sem novo `OnboardingGuide` overlay.

### 6) Painel admin (opcional, leve)

Em `Assinantes.tsx`, nova aba "Automações" mostrando últimos envios de `email_automation_log` (admin-only) — útil para você acompanhar conversão sem abrir o banco.

## Estratégia de gatilhos psicológicos (resumo)

| Toque | Gatilho | Tom |
|-------|---------|-----|
| D+1 | Zeigarnik (tarefa inacabada) + progresso | Leve, lembrete amigável |
| D+3 | Prova social + escassez (cupom expira) | Urgente, conversacional |
| D+7 | Aversão à perda + última chance | Final, definitivo |
| Power user | Reconhecimento + remoção de fricção | Celebratório + upsell |

## Limites e proteções

- Idempotência por chave única em `email_automation_log` — impossível enviar duas vezes.
- Respeita `suppressed_emails` automaticamente (sender já checa).
- Unsubscribe link já vem no rodapé (sistema injeta).
- Throughput controlado pela fila pgmq existente.
- Admin (você) é excluído de ambas as automações (`oluciano.dosantos@gmail.com`).

## Ordem de execução

1. Migration: `email_automation_log` + coluna `last_reengagement_step` + RLS.
2. 4 templates React Email + atualizar `registry.ts`.
3. Edge function `onboarding-reengagement-cron`.
4. Edge function `power-user-upgrade-cron`.
5. pg_cron via `supabase--insert` (2 jobs).
6. Refinar `OnboardingPrompt` e `OnboardingCouponBanner`.
7. (Opcional) Aba Automações no admin.
8. Smoke test: invocar manualmente cada cron via curl, verificar `email_automation_log` e `email_send_log`.

## Fora de escopo

- Não alterar Stripe / cupom / fluxo de pagamento.
- Não tocar em `OnboardingFlow` / `OnboardingChat` / `useOnboardingSession`.
- Não criar novo provedor de e-mail.
- Não enviar via WhatsApp nesta entrega (pode ser fase 2).
