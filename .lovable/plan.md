
# Integração Stripe - Pagamento de Assinaturas

## Produtos e Preços Criados no Stripe

Todos os 6 preços foram criados com sucesso:

| Plano | Intervalo | Valor | Product ID | Price ID |
|---|---|---|---|---|
| Plus | Mensal | R$119/mês | prod_U23sAKDoEq8OES | price_1T3zkNH7IRFB6gqObtWc6gv5 |
| Plus | Anual | R$99/mês | prod_U23skBVnn0VuO1 | price_1T3zkbH7IRFB6gqO2mzqrZDl |
| Pro | Mensal | R$249/mês | prod_U23sma8YXQQIDT | price_1T3zl3H7IRFB6gqOyUJGRvfg |
| Pro | Anual | R$199/mês | prod_U23tHVjIomeZla | price_1T3zlSH7IRFB6gqO6WwEXP4m |
| Enterprise | Mensal | R$497/mês | prod_U23toHCQFVRSOr | price_1T3zlmH7IRFB6gqOPr0fsrrI |
| Enterprise | Anual | R$397/mês | prod_U23tKmvlVDm3lS | price_1T3zm4H7IRFB6gqOpQSBEWjm |

---

## O que será implementado

### 1. Edge Function: `create-checkout`
Cria uma sessao de checkout do Stripe para assinaturas. Recebe o `priceId` do frontend, autentica o usuario, e retorna a URL de pagamento.

### 2. Edge Function: `check-subscription`
Verifica se o usuario tem assinatura ativa no Stripe. Retorna o status, plano (plus/pro/enterprise) e data de vencimento. Chamada no login, ao carregar a pagina, e periodicamente.

### 3. Edge Function: `customer-portal`
Cria sessao do portal do cliente Stripe para gerenciar assinatura (cancelar, trocar cartao, alterar plano).

### 4. Atualizar `PlanContext.tsx`
Integrar a verificacao de assinatura via Stripe (`check-subscription`) ao contexto global. O plano do usuario sera determinado pela assinatura ativa no Stripe, nao apenas pela tabela local `subscriptions`.

### 5. Atualizar `Planos.tsx`
O botao "Assinar" chamara `create-checkout` com o `priceId` correto (mensal ou anual). Apos pagamento, o usuario sera redirecionado de volta ao app.

### 6. Atualizar `BillingPanel.tsx`
Mostrar data do proximo pagamento real e adicionar botao "Gerenciar Assinatura" que abre o portal do cliente Stripe.

### 7. Config.toml
Adicionar as 3 novas funcoes com `verify_jwt = false`.

---

## Fluxo do Usuario

```text
1. Usuario acessa /planos
2. Escolhe mensal ou anual, clica "Assinar"
3. Redirecionado ao Checkout do Stripe
4. Paga e retorna ao app
5. check-subscription detecta assinatura ativa
6. PlanContext atualiza plano para plus/pro/enterprise
7. Recursos desbloqueados automaticamente
```

---

## Detalhes Tecnicos

### Mapeamento de planos (constante no frontend)
Dicionario mapeando `product_id` do Stripe para o nome do plano interno (`plus`, `pro`, `enterprise`), e `price_id` para cada combinacao plano + intervalo.

### Arquivos criados
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/customer-portal/index.ts`

### Arquivos modificados
- `supabase/config.toml` - Adicionar 3 funcoes
- `src/contexts/PlanContext.tsx` - Integrar check-subscription
- `src/pages/Planos.tsx` - Conectar botoes ao checkout
- `src/components/user/BillingPanel.tsx` - Portal do cliente + dados reais

### Dependencias
Nenhuma nova no frontend. Edge functions usam `stripe@18.5.0` via ESM.
