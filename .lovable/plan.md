
## Decisão

Manter Stripe como gateway e adicionar **PIX** e **Boleto** ao checkout — o Stripe já processa ambos no Brasil de forma nativa. Isso resolve a limitação de "só cartão" sem refatorar edge functions, PlanContext, webhook, portal e cancelamento (que já estão prontos e estáveis).

Cupons, Portal do Cliente e webhooks de status **já existem hoje** — nada a fazer aí.

## O que muda no código

### 1. `supabase/functions/create-checkout/index.ts`
Adicionar métodos de pagamento à sessão de checkout Stripe:

- Incluir `payment_method_types: ["card", "boleto"]` para **planos mensais e à vista**.
  - PIX no Stripe **não é aceito em `mode: subscription`** (limitação da própria Stripe). Portanto:
    - **Assinatura recorrente (mensal/anual)** → `card` + `boleto`.
    - Se no futuro houver checkout one-off (`mode: payment`) → aí sim `card` + `boleto` + `pix`.
- Manter `allow_promotion_codes: true` (cupons já funcionam).
- Adicionar `subscription_data.trial_period_days: 7` como padrão (configurável por plano).
- Ajustar `payment_method_collection` conforme necessário para trial (permitir iniciar sem cartão se desejado, ou exigir).

### 2. `src/pages/Planos.tsx` (leve)
- Adicionar badges "Aceita PIX, Boleto e Cartão" e "7 dias grátis" próximo aos planos, para o usuário saber antes de clicar.
- Nenhuma mudança de lógica — o Stripe Checkout renderiza os métodos automaticamente.

### 3. `src/components/user/BillingPanel.tsx`
- Nenhuma mudança obrigatória. Se houver trial ativo, o `check-subscription` já retorna `subscription_end`; adicionar apenas um rótulo "Em período de teste" quando `trial_end > now` (opcional, cosmético).

### 4. `supabase/functions/check-subscription/index.ts`
- Já reconhece assinaturas `active`. Adicionar `trialing` ao status considerado válido para liberar plano durante o teste:
  ```ts
  status: "active" // → passar a listar active E trialing
  ```

### 5. Pré-requisitos no dashboard Stripe (ação do usuário — 1x)
Explicar no chat ao aprovar o plano:
- Ativar **Boleto** em Stripe Dashboard → Settings → Payment methods → Boleto.
- (Opcional futuro) Ativar PIX no mesmo lugar, para uso quando houver produtos one-off.
- Nenhuma nova secret. `STRIPE_SECRET_KEY` continua a mesma.

## O que NÃO muda
- Nada de trocar gateway, nada de novo webhook, nada de migração de assinantes (não há base ativa).
- `customer-portal`, `cancel-subscription`, `stripe-webhook`, PlanContext, cupons — permanecem intactos.
- Preços e produtos existentes no Stripe continuam válidos.

## Fora de escopo
- PIX em assinatura recorrente (limitação da Stripe, não do código).
- Migração para Asaas/Mercado Pago/Pagar.me (descartado nesta resposta).
- Ajustes visuais de checkout — o UI do checkout é hospedado pela Stripe.

## Riscos
- **Boleto tem D+1 a D+3 para compensar.** Isso afeta trial: se o usuário assinar com boleto no fim do trial, o acesso pode expirar antes do pagamento cair. Mitigação: `subscription_data.trial_settings.end_behavior.missing_payment_method = "pause"` para pausar assinatura em vez de cancelar.
- Boleto **não renova automaticamente** em assinaturas — o Stripe emite novo boleto a cada ciclo e o cliente precisa pagar. Deixar isso claro na copy do plano.
