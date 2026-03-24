## Plano: 4 Implementações

### 1. Aumentar limite gratuito de 5 para 20

**Arquivo**: `src/hooks/useFreemiumLimit.ts`

- Alterar `FREE_LIMIT = 5` para `FREE_LIMIT = 20`
- Atualizar a função `populate_demo_data` para manter compatibilidade (dados demo < 20, ok)

### 2. Novos preços (barreira mais baixa)

Seu assinante atual **não será afetado** — a assinatura dele continua com o price_id original.

Novos valores propostos (mantendo proporção):


| Plano      | Mensal | Anual (mês) | Anual (total) |
| ---------- | ------ | ----------- | ------------- |
| Plus       | R$69   | R$55        | R$660         |
| Pro        | R$149  | R$119       | R$1.428       |
| Enterprise | R$297  | R$237       | R$2.844       |


**Passos**:

- Criar 6 novos preços no Stripe (3 planos x 2 intervalos) via ferramentas Stripe
- Atualizar `src/lib/stripe-plans.ts` com os novos price_ids e product_ids
- Atualizar `src/pages/Planos.tsx` com os novos valores de exibição

### 3. Integração WhatsApp (Tarefas, Clientes, Financeiro)

**Abordagem**: Usar o conector Twilio (disponível como connector) que suporta envio de WhatsApp via API.

**Passos**:

- Conectar o Twilio ao projeto via connector
- Criar edge function `send-whatsapp` que envia mensagens via Twilio/WhatsApp gateway
- Criar edge function `whatsapp-scheduler` (cron diário) que verifica:
  - Tarefas vencendo nas próximas 24h → notifica responsável
  - Clientes sem interação há 30+ dias → envia follow-up
  - Transações pendentes próximas do vencimento → alerta financeiro
- Adicionar tabela `whatsapp_preferences` para usuários configurarem seu número e preferências de notificação
- Adicionar UI de configuração WhatsApp nas Configurações do perfil (número, toggle por tipo de notificação)

**Nota**: O Twilio requer um número WhatsApp Business aprovado. Você precisará configurar isso no painel do Twilio.

### 4. Guia de Uso interativo

Transformar a página estática `Guia.tsx` em um onboarding interativo com checklist real:

**Banco de dados**:

- Criar tabela `onboarding_progress` com colunas: `user_id`, `step_id` (text), `completed_at` (timestamp)

**Frontend** (`src/pages/Guia.tsx`):

- Substituir o `currentStep` estático por progresso real salvo no banco
- Cada task dentro das etapas vira um checkbox clicável que marca como concluído
- Barra de progresso reflete tarefas realmente concluídas (não apenas cliques)
- Ao completar uma tarefa, redirecionar automaticamente para o módulo relevante (ex: "Cadastre seu primeiro cliente" → abre `/clientes`)
- Adicionar animações de celebração (confetti) ao completar etapas
- Mostrar badge "Concluído" em etapas finalizadas
- Ao completar 100%, exibir mensagem de parabéns com CTA para dashboard

**Arquivos impactados**:

- `src/hooks/useFreemiumLimit.ts` (limite)
- `src/lib/stripe-plans.ts` + `src/pages/Planos.tsx` (preços)
- `supabase/functions/send-whatsapp/index.ts` (novo)
- `supabase/functions/whatsapp-scheduler/index.ts` (novo)
- `src/pages/Guia.tsx` (onboarding interativo)
- 2 migrations SQL (whatsapp_preferences, onboarding_progress)

&nbsp;

Alterar os preços na tela de preços também