## Fluxo Híbrido — Cartão recorrente OU Pix/Boleto/Cartão avulso

Na página de planos, cada plano mostra **duas opções de pagamento**:

- **"Assinar com cartão (automático)"** → checkout Asaas `RECURRENT` (`CREDIT_CARD`). Cobra sozinho todo mês/ano.
- **"Pagar com Pix, Boleto ou Cartão"** → checkout Asaas `DETACHED` com os 3 meios. Renovação por link a cada ciclo.

## Backend

### 1. `create-asaas-checkout` (edge function)
Aceita novo parâmetro `mode: "recurring" | "one_time"`.
- `recurring`: `chargeTypes: ["RECURRENT"]`, `billingTypes: ["CREDIT_CARD"]`, `subscriptionCycle` (MONTHLY/YEARLY).
- `one_time`: `chargeTypes: ["DETACHED"]`, `billingTypes: ["PIX","BOLETO","CREDIT_CARD"]`, `value`, `dueDateLimitDays: 3`.
- `externalReference` sempre carrega `{ user_id, plan, mode, cycle }`.

### 2. `asaas-webhook`
Já trata `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`. Ajustes:
- Ler `mode` do `externalReference`.
- Atualizar `subscriptions`: `status='active'`, `plan`, `provider='asaas'`, `payment_mode`, `current_period_end = now() + interval` (30d mensal / 365d anual), `last_payment_id`.
- `PAYMENT_OVERDUE` → `status='past_due'` (mantém acesso até `current_period_end`).
- `SUBSCRIPTION_DELETED` → só afeta usuários no modo recurring: `cancel_at_period_end=true`.

### 3. `asaas-renew-charges` (nova edge function + cron diário)
Só para `payment_mode='one_time'` com `current_period_end` entre hoje e +5 dias e `cancel_at_period_end=false`:
- Cria novo checkout `DETACHED`, salva `pending_renewal_url`.
- Envia e-mail (Resend) + notificação in-app com o link.
- Se `current_period_end < now() - 7d` sem pagamento novo → downgrade para `gratuito`.

Cron via `pg_cron` + `pg_net` (uma vez por dia às 09:00 BRT), inserido via ferramenta de insert (não migration).

### 4. `cancel-asaas-subscription`
- `recurring`: chama `DELETE /subscriptions/{id}` no Asaas + marca `cancel_at_period_end=true` local.
- `one_time`: só marca `cancel_at_period_end=true` (job de renovação para de gerar cobrança).

## Schema (`subscriptions`) — migration

Adicionar colunas:
- `current_period_end timestamptz`
- `cancel_at_period_end boolean default false`
- `payment_mode text` (`'recurring' | 'one_time'`)
- `last_payment_id text`
- `pending_renewal_url text`
- `asaas_subscription_id text` (só quando modo recurring)

## Frontend

### `Planos.tsx`
Cada card de plano vira dois botões:
```
[ Assinar com cartão automático → ]   Débito recorrente. Cancela quando quiser.
[ Pix / Boleto / Cartão avulso →  ]   Renovação por link a cada ciclo.
```
Selos Pix/Boleto/Cartão restaurados no card "avulso".

### `MinhaAssinatura` (ou seção de conta)
Se `payment_mode='one_time'` e existe `pending_renewal_url`, mostrar banner "Renovar agora" com o link. Botão de cancelar chama a mesma edge function nos dois modos.

### `PlanContext.tsx`
Nenhuma mudança de API. Já lê `subscriptions.plan` + `status`.

## Ordem de execução

1. Migration schema `subscriptions`.
2. Editar `create-asaas-checkout`, `cancel-asaas-subscription`, `asaas-webhook`.
3. Criar `asaas-renew-charges` + cron (via insert tool com URL/anon key).
4. Atualizar `Planos.tsx` e banner de renovação.
5. Testar: (a) recurring cartão em produção, (b) one_time Pix — confirmar no painel Asaas → webhook libera plano.

## Não vou tocar

- Stripe (já removido).
- Lógica de `plan_features`, `PlanGate`, gating.
- Fluxo de admin manual de assinaturas.
