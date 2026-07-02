## Diagnóstico

**Rose Nascimento (roseengsp@gmail.com)** aparece como **Plus ativa** no painel, mas no provedor de pagamento (Stripe) a assinatura dela está assim:

- **Status real:** Cancelada em **01/07/2026** (ontem)
- **Motivo do cancelamento:** `payment_failed` — a cobrança de renovação de julho falhou (provavelmente cartão recusado/expirado)
- **Última cobrança bem-sucedida:** junho/2026 (R$ 69,00 — Plus mensal)
- **Nenhum pagamento** foi registrado em julho

Ou seja: você está correto — ela não pagou julho. O que aconteceu foi que a cobrança automática falhou, o Stripe tentou algumas vezes e cancelou a assinatura definitivamente ontem.

**Por que o painel ainda mostra "Plus ativa"?**
A tabela local `subscriptions` guarda `plan=plus / status=active` desde 17/06 e nunca foi atualizada porque:
1. A função `check-subscription` só roda quando a **própria Rose** faz login (e ela não entrou desde o cancelamento).
2. A função `sync-subscribers` (usada no painel de assinantes) só varre assinaturas com `status=active` no Stripe — como a dela já foi cancelada, ela é ignorada e o registro local fica desatualizado.

## Plano

### 1. Corrigir o registro da Rose agora (one-off)
Atualizar a linha dela em `subscriptions` para refletir a realidade:
- `plan` → `gratuito`
- `status` → `canceled`
- `ends_at` → `2026-07-01` (data do cancelamento no Stripe)

Isso vai fazer o painel mostrar imediatamente que ela caiu para o gratuito.

### 2. Ajustar `sync-subscribers` para também capturar cancelamentos
Hoje a função só busca `status: "active"` no Stripe. Vou alterar para também buscar assinaturas `canceled` / `past_due` / `unpaid` e:
- Rebaixar para `gratuito` + `status=canceled` quando a assinatura no Stripe estiver cancelada
- Marcar `status=past_due` quando houver falha de cobrança em aberto

Assim o botão "Sincronizar" no painel de assinantes passa a corrigir divergências como essa automaticamente.

### 3. (Opcional, recomendo) Aviso visual no painel
Adicionar na aba de assinantes uma coluna/badge "Última cobrança" e destacar em vermelho quem está com pagamento falho ou sem cobrança há mais de 35 dias — para você identificar esses casos antes de virar cancelamento.

### 4. (Opcional) E-mail automático de "cartão recusado"
Configurar no Stripe (Billing → Emails) o envio automático de aviso de falha de cobrança e link para atualizar o cartão. Isso reduz cancelamentos por cartão vencido. Posso te guiar quando quiser.

## Detalhes técnicos

- Update direto via migration na tabela `public.subscriptions` para `user_id = f6e2afd1-175e-4885-8fed-4e9816ebf6af`.
- Em `supabase/functions/sync-subscribers/index.ts`: trocar o `stripe.subscriptions.list({ status: "active" })` por um loop que também lista `canceled`, `past_due` e `unpaid`, aplicando o downgrade correto no upsert local.
- Sem mudanças de schema; apenas dados + edge function.

Confirma que posso aplicar os itens 1 e 2? Os itens 3 e 4 posso deixar para uma rodada seguinte se preferir.
