# Migração Stripe → Asaas

Substituir o gateway atual (Stripe) pelo Asaas como único meio de pagamento, com suporte a **Pix recorrente**, **Boleto** e **Cartão de crédito**. Planos e valores mantidos (Plus R$69/mês · Pro R$149/mês · Enterprise R$297/mês, com anuais equivalentes).

## Pré-requisito (você)

1. Criar conta no Asaas: https://www.asaas.com/ (sandbox primeiro é recomendado — https://sandbox.asaas.com/)
2. Em **Integrações → API** copiar a chave (`$aact_...`)
3. Quando eu pedir, colar em:
   - `ASAAS_API_KEY` (chave)
   - `ASAAS_ENV` (`sandbox` ou `prod`)
   - `ASAAS_WEBHOOK_TOKEN` (string aleatória que você define; usada para validar callbacks)

Depois no painel Asaas: **Configurações → Integrações → Webhooks** apontar para a URL da função `asaas-webhook` (te entrego após deploy) usando o mesmo token.

## Etapa 1 — Backend Asaas (expandir o que já existe)

Já temos `create-asaas-checkout` (Pix) e `asaas-webhook`. Vou:

1. **`supabase/functions/_shared/asaas.ts`** — adicionar suporte a `billingType`: `PIX`, `BOLETO`, `CREDIT_CARD` e `UNDEFINED` (deixa o cliente escolher na página hospedada do Asaas).
2. **`create-asaas-checkout`** — aceitar `method` no body (`pix` | `boleto` | `credit_card` | `any`). Padrão `UNDEFINED` para dar ao usuário a escolha dos três na tela do Asaas (melhor UX).
3. **Nova função `check-asaas-subscription`** — substitui `check-subscription`. Busca cliente pelo `externalReference = user.id`, lista assinaturas ativas, retorna `{ subscribed, plan, subscription_end }`.
4. **Nova função `cancel-asaas-subscription`** — substitui `cancel-subscription`. Deleta a assinatura Asaas ativa do usuário e rebaixa `subscriptions` para `gratuito`.
5. **`asaas-webhook`** — já cobre `PAYMENT_CONFIRMED/RECEIVED` e cancelamentos; adicionar tratamento de `PAYMENT_OVERDUE` (marca `past_due`) e `SUBSCRIPTION_UPDATED`.

## Etapa 2 — Remover Stripe

Deletar:
- Edge functions: `create-checkout`, `check-subscription`, `customer-portal`, `cancel-subscription`, `stripe-webhook`
- `src/lib/stripe-plans.ts`
- Segredo `STRIPE_SECRET_KEY` (via UI de Secrets — te aviso quando)

Referências a limpar/substituir:
- `src/pages/Planos.tsx` — trocar chamadas de `create-checkout` por `create-asaas-checkout`, remover badges/textos Stripe, adicionar seletor Pix/Boleto/Cartão
- `src/components/user/BillingPanel.tsx` — trocar `check-subscription` → `check-asaas-subscription`, remover botão "Portal Stripe", trocar por "Cancelar assinatura" (nova função)
- `src/components/user/CancelSubscriptionDialog.tsx` — apontar para `cancel-asaas-subscription`
- `src/contexts/PlanContext.tsx` (se chama check-subscription) — atualizar
- Qualquer badge/UI que mencione "Stripe", "cartão apenas", "portal Stripe"

## Etapa 3 — UI Planos

Em `src/pages/Planos.tsx`:
- Substituir subtexto por: **"Pague com Pix, Boleto ou Cartão"** com ícones
- Manter toggle mensal/anual
- Botão "Assinar" → abre `create-asaas-checkout` (método `UNDEFINED` — Asaas mostra as 3 opções na página hospedada, evita fricção)
- Manter trial? **Não** — Asaas não tem trial nativo em assinaturas; posso implementar via `nextDueDate = hoje + 7d` se quiser (te pergunto depois se necessário)

## Etapa 4 — Migração de assinantes atuais Stripe

Você optou por **remover Stripe totalmente**. Impactos:
- Assinantes Stripe atuais **param de renovar** (Stripe segue cobrando até você cancelar no painel Stripe)
- Eles precisam refazer assinatura via Asaas
- **Recomendo**: rodar um script único que marca todos como `gratuito` na tabela `subscriptions` e dispara e-mail avisando + link para reassinar. Posso preparar depois.

## Etapa 5 — Deploy + validação

1. Deploy das funções Asaas
2. Você configura webhook no painel Asaas
3. Teste sandbox: assinar Plus mensal via Pix → confirmar pagamento no painel sandbox → conferir `subscriptions.plan = 'plus'`
4. Repetir com boleto e cartão
5. Trocar `ASAAS_ENV` para `prod` com chave de produção

## Detalhes técnicos

**Mapeamento plano ↔ Asaas**: usamos `externalReference = "{user_id}|{plan}"` na assinatura Asaas (já implementado). O webhook faz o parse e atualiza `public.subscriptions`.

**Estados de assinatura** na tabela `subscriptions`:
- `active` — pagamento confirmado
- `past_due` — boleto/pix vencido (novo)
- `canceled` — cancelamento manual ou falha crônica

**Segurança**: webhook valida header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` (já implementado). Funções client-facing validam JWT do usuário.

**Rate limit**: Asaas permite 20 req/s no sandbox e 100 req/s em prod — suficiente.

## Ordem de execução

1. Você cria conta Asaas + pega API key sandbox
2. Eu peço `ASAAS_API_KEY` + `ASAAS_ENV=sandbox` + `ASAAS_WEBHOOK_TOKEN` (via add_secret)
3. Eu implemento etapas 1–3 e faço deploy
4. Te passo a URL do webhook para configurar no painel Asaas
5. Você testa em sandbox
6. Aprovado → trocamos para chave de produção e removemos Stripe
