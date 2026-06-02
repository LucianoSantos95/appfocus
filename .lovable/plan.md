# Cancelamento de Plano com Feedback

Hoje, no painel **Faturamento** (`BillingPanel.tsx`), usuários com plano ativo só veem **"Gerenciar Assinatura"** (portal Stripe). Não há botão de cancelamento direto nem captura do motivo. Vamos adicionar isso.

## O que será feito

### 1. Nova tabela `cancellation_feedback`
Armazena feedbacks de cancelamento para análise.

Campos:
- `user_id`, `nome`, `email`
- `plano_anterior` (plus/pro/enterprise)
- `motivo` (categoria: ex. "muito caro", "não uso", "faltam recursos", "encontrei alternativa", "outro")
- `comentario` (texto livre opcional)
- `created_at`

Acesso:
- Usuário pode inserir o próprio feedback
- Apenas **admins** podem visualizar todos os registros (para análise)

### 2. Botão "Cancelar Plano" no BillingPanel
- Aparece somente quando `plan !== 'gratuito'`
- Posicionado abaixo de "Gerenciar Assinatura", com estilo discreto (variant `ghost` em vermelho suave) para não competir com o upgrade

### 3. Modal de Cancelamento
Ao clicar em "Cancelar Plano", abre um dialog com:
- Mensagem empática ("Sentimos muito em ver você ir...")
- **Select obrigatório** com motivo (categorias acima)
- **Textarea opcional** para detalhar
- Botões: "Manter assinatura" / "Confirmar cancelamento"

Ao confirmar:
1. Salva feedback em `cancellation_feedback`
2. Cancela assinatura no Stripe via edge function `cancel-subscription` (nova)
3. Atualiza `subscriptions` para `gratuito` / `ends_at = now()`
4. Mostra toast de confirmação e fecha o modal
5. Chama `refreshSubscription()` para atualizar UI

### 4. Edge function `cancel-subscription`
Recebe JWT do usuário, busca customer Stripe pelo e-mail, cancela a subscription ativa (`stripe.subscriptions.cancel`), e atualiza a tabela `subscriptions` local via service role.

## Arquivos afetados

- **Novo:** `supabase/migrations/...` — cria `cancellation_feedback` com GRANTs e RLS
- **Novo:** `supabase/functions/cancel-subscription/index.ts`
- **Novo:** `src/components/user/CancelSubscriptionDialog.tsx`
- **Editado:** `src/components/user/BillingPanel.tsx` — adicionar botão e abrir o dialog
- **Editado:** `supabase/config.toml` — registrar a nova função com `verify_jwt = false`

## Pergunta antes de implementar

As categorias de motivo que vou usar no select:
1. Muito caro para o meu momento
2. Não estou usando o suficiente
3. Faltam recursos que preciso
4. Encontrei uma alternativa melhor
5. Problemas técnicos / bugs
6. Apenas testei, não era para mim
7. Outro (descrever)

Posso seguir com essa lista, ou prefere ajustar?