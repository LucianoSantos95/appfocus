## Diagnóstico

O erro acontece porque estamos usando `POST /subscriptions`, que exige um **cliente já cadastrado com CPF/CNPJ**. Esse endpoint foi feito pra assinaturas criadas no painel/backoffice, não pra auto-checkout.

O produto certo do Asaas pra esse caso é o **Checkout Asaas** (`POST /checkouts`), que gera uma página hospedada onde o **próprio cliente preenche nome, e-mail, CPF/CNPJ e telefone** antes de escolher Pix/Boleto/Cartão. É exatamente o fluxo Stripe Checkout / Paddle equivalente.

## Solução

Trocar a criação de assinatura direta por um **Checkout hospedado do Asaas**, sem pedir nada de documento no nosso app.

### 1. Backend — `supabase/functions/create-asaas-checkout/index.ts`
- Substituir a chamada de `POST /subscriptions` por `POST /v3/checkouts` com:
  - `billingTypes: ["PIX","BOLETO","CREDIT_CARD"]` (Asaas exibe os 3)
  - `chargeTypes: ["RECURRENT"]` + `subscription: { cycle, nextDueDate, endDate? }`
  - `items: [{ description, value, quantity: 1 }]` com preço do plano
  - `callback: { successUrl, cancelUrl, expiredUrl }` apontando pra `/planos?success=true` e `/planos?canceled=true`
  - `customerData: { email }` (só pré-preenche; CPF fica na página do Asaas)
  - `externalReference: "${user.id}|${plan}|${cycle}"` pro webhook mapear
- Resposta: `{ url: checkout.link }` — a URL hospedada que já pede CPF.
- Remover `findOrCreateCustomer` do fluxo de checkout (fica só pra outros usos, se houver).

### 2. Backend — `supabase/functions/asaas-webhook/index.ts`
Verificar/ajustar:
- `CHECKOUT_PAID` (novo evento) → marcar `subscriptions` como ativa usando o `externalReference` do checkout.
- Continuar tratando `PAYMENT_CONFIRMED/RECEIVED/OVERDUE/DELETED` para renovações — o Asaas cria a subscription server-side automaticamente após o pagamento e emite esses eventos normalmente.
- Se o `subscription.id` vier no payload do checkout pago, persistir em `subscriptions.gateway_subscription_id` pra permitir cancelamento futuro pelo `cancel-asaas-subscription`.

### 3. Backend — `_shared/asaas.ts`
Adicionar helper `createCheckout(payload)` fino em cima de `asaas("/checkouts","POST",...)`. Manter `findOrCreateCustomer` intocado (usado em outros fluxos).

### 4. Frontend — nenhuma mudança de UX
`Planos.tsx` continua igual: clica em "Assinar agora" → recebe `url` → `window.location.href = url`. Zero novos dialogs, zero campos de CPF antes do pagamento.

### 5. Configuração (o que você precisa fazer no painel Asaas)
- Ativar o produto **Checkout** na conta (Configurações → Checkout). Já vem habilitado por padrão em contas novas.
- Confirmar que o webhook existente escuta o evento `CHECKOUT_PAID` além dos de PAYMENT.

## Fora de escopo
- Nenhuma mudança em Stripe (já removido).
- Nenhuma coleta de CPF no app.
- Nenhuma migration de banco.

## Arquivos afetados
- `supabase/functions/create-asaas-checkout/index.ts` (reescrever payload)
- `supabase/functions/_shared/asaas.ts` (helper `createCheckout`)
- `supabase/functions/asaas-webhook/index.ts` (tratar `CHECKOUT_PAID` e persistir `gateway_subscription_id`)
