

# Plano Detalhado de Evolução do Focus Hub — Instruções Exatas por Fase

---

## FASE 0 — Textos de Nicho (já documentada, manter como está)
Sem alterações. O plano atual do `.lovable/plan.md` já detalha cada substituição de texto.

---

## FASE 1 — Agente de IA Completo (Hub Assistant)

### 1.1 Criar `supabase/functions/hub-assistant/index.ts`

**Estrutura exata da Edge Function:**

1. **CORS**: Usar `corsHeaders` padrão. Responder `OPTIONS` com 200.
2. **Autenticação**: Extrair `Authorization: Bearer <token>` do header. Usar `supabaseAuth.auth.getClaims(token)` para obter `userId` (mesmo padrão do `analyze-client/index.ts`).
3. **Rate limiting**: Reusar o padrão de `analyze-client` — tabela `rate_limits`, endpoint `"hub-assistant"`, máximo 30 req/hora.
4. **Body esperado**: `{ messages: Array<{ role: "user"|"assistant", content: string }> }` — o histórico completo da conversa enviado pelo frontend.
5. **System prompt**: String longa embutida na function contendo:
   - Descrição de cada módulo do Hub (Finanças, RH, Marketing, Projetos, Clientes, Atividades, Processos, Agenda, Mural)
   - Para cada módulo: nome da tabela, colunas editáveis, e exemplos de comandos que o usuário pode dar
   - Regras: "Sempre confirme antes de deletar", "Nunca invente dados", "Responda em português", "Ao consultar dados e detectar problemas, sugira ações proativamente"
   - Contexto de nicho: "O usuário é dono de uma agência ou consultoria"
6. **Tools (3 ferramentas)** registradas no payload para a AI Gateway:

   **Tool `query_data`:**
   ```json
   {
     "name": "query_data",
     "description": "Consulta dados do usuário em um módulo específico",
     "parameters": {
       "type": "object",
       "properties": {
         "module": { "type": "string", "enum": ["clientes","projetos","tarefas","transacoes","colaboradores","campanhas","processos","conteudos","agenda_items","bulletin_notes","contas_bancarias"] },
         "filters": { "type": "object", "description": "Filtros opcionais como {status: 'ativo', priority: 'alta'}" },
         "limit": { "type": "number", "description": "Máximo de registros (default 50)" }
       },
       "required": ["module"]
     }
   }
   ```
   **Implementação**: Usar `supabaseService.from(module).select("*").eq("user_id", userId)` + aplicar cada filtro com `.eq()`. Limitar a 50 registros. Retornar JSON dos resultados.

   **Tool `crud_operation`:**
   ```json
   {
     "name": "crud_operation",
     "description": "Cria, atualiza ou exclui um registro",
     "parameters": {
       "type": "object",
       "properties": {
         "action": { "type": "string", "enum": ["create","update","delete"] },
         "module": { "type": "string", "enum": ["clientes","projetos","tarefas","transacoes","colaboradores","campanhas","processos","conteudos","agenda_items","bulletin_notes","contas_bancarias"] },
         "record_id": { "type": "string", "description": "UUID do registro (obrigatório para update/delete)" },
         "data": { "type": "object", "description": "Campos e valores para create/update" }
       },
       "required": ["action","module"]
     }
   }
   ```
   **Implementação**:
   - `create`: `supabaseService.from(module).insert({ ...data, user_id: userId }).select().single()` — retornar o registro criado
   - `update`: `supabaseService.from(module).update(data).eq("id", record_id).eq("user_id", userId).select().single()` — sempre filtrar por user_id
   - `delete`: `supabaseService.from(module).delete().eq("id", record_id).eq("user_id", userId)` — retornar confirmação
   - **Whitelist de campos por módulo**: Criar um objeto `ALLOWED_FIELDS` que mapeia cada módulo para seus campos editáveis. Rejeitar campos fora da whitelist.

   **Tool `business_insights`:**
   ```json
   {
     "name": "business_insights",
     "description": "Analisa dados do usuário e retorna alertas e dicas",
     "parameters": {
       "type": "object",
       "properties": {
         "areas": { "type": "array", "items": { "type": "string", "enum": ["financeiro","projetos","tarefas","clientes","rh","marketing"] } }
       },
       "required": ["areas"]
     }
   }
   ```
   **Implementação**: Para cada área solicitada, executar queries específicas:
   - `financeiro`: buscar transações do mês atual, calcular receita/despesa/lucro, listar transações pendentes
   - `projetos`: buscar projetos com `end_date < now() + 7 dias` e `status != 'concluido'`
   - `tarefas`: buscar tarefas com `due_date < now()` e `status = 'pendente'`
   - `clientes`: buscar clientes com `ultima_interacao < now() - 30 dias` e `status = 'ativo'`
   - `rh`: contar colaboradores ativos, calcular folha salarial total
   - `marketing`: buscar campanhas ativas sem end_date ou com end_date próximo
   - Retornar objeto JSON com os resultados de cada área

7. **Loop de tool calling**:
   - Enviar mensagens + tools para `https://ai.gateway.lovable.dev/v1/chat/completions` com modelo `google/gemini-3-flash-preview`
   - Se a resposta contém `tool_calls`: executar cada tool, montar array de `tool` messages com resultados, re-enviar ao modelo
   - Repetir até a resposta ser texto final (sem tool_calls) — máximo 5 iterações para evitar loops infinitos
   - **Não usar streaming no loop de tools** — apenas na resposta final

8. **Streaming SSE da resposta final**:
   - Após o loop de tools terminar e obter a resposta textual final, fazer uma última chamada com `stream: true`
   - Retornar `new Response(body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } })`
   - Fazer pipe do ReadableStream da AI Gateway direto para o Response

9. **Tratamento de erros**: 429 (rate limit), 402 (créditos), 500 (erro genérico) — mesmos padrões de `analyze-client`.

### 1.2 Criar `src/components/chat/ChatMessage.tsx`

- Props: `{ role: "user"|"assistant"|"system", content: string, isLoading?: boolean }`
- Se `role === "user"`: bolha alinhada à direita, fundo `bg-primary text-primary-foreground`, bordas arredondadas
- Se `role === "assistant"`: bolha alinhada à esquerda, fundo `bg-muted`, conteúdo renderizado com `ReactMarkdown` (import de `react-markdown`)
- Se `isLoading`: exibir 3 dots animados (CSS pulsing)
- Adicionar indicador visual de "ação executada" — quando o conteúdo contém `✅` (que o system prompt instrui o modelo a usar ao confirmar CRUD), exibir com destaque

### 1.3 Criar `src/components/chat/AIChatWidget.tsx`

**State**:
- `isOpen: boolean` — controla se a janela está aberta
- `messages: Array<{ role, content }>` — histórico da sessão (não persiste)
- `input: string` — campo de texto
- `isLoading: boolean` — indicador de processamento
- `isStreaming: boolean` — indicador de streaming

**Layout**:
- Botão flutuante: `fixed bottom-6 right-6 z-50`, ícone `MessageSquare` do lucide-react, tamanho `56x56px`, fundo `bg-primary`, `rounded-full`, `shadow-lg`
- Janela de chat: `fixed bottom-24 right-6 z-50`, largura `400px`, altura `500px`, `rounded-2xl`, `border`, `bg-background`, `shadow-xl`
- Mobile (`useIsMobile()`): janela ocupa tela inteira `fixed inset-0 z-50`
- Header da janela: "Assistente Focus" + botão X para fechar
- Área de mensagens: `flex-1 overflow-y-auto p-4 space-y-3`, scroll automático para baixo ao receber mensagem
- Sugestões rápidas (exibir apenas quando `messages.length === 0`): chips clicáveis com textos "O que está atrasado?", "Resumo da minha operação", "Criar tarefa", "Adicionar cliente"
- Input: `flex` row com `Input` + botão `Send` (ícone `SendHorizonal`), desabilitado durante loading

**Lógica de envio**:
1. Ao enviar mensagem: adicionar ao array `messages`, setar `isLoading = true`
2. Chamar `supabase.functions.invoke("hub-assistant", { body: { messages } })` — NÃO, usar `fetch` direto para suportar streaming:
   ```ts
   const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hub-assistant`;
   const res = await fetch(url, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${session.access_token}`,
       "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
     },
     body: JSON.stringify({ messages }),
   });
   ```
3. Ler o stream: `res.body.getReader()`, decodificar chunks, parsear linhas SSE (`data: ...`), concatenar tokens no último message do array
4. Ao finalizar stream: `isLoading = false`, `isStreaming = false`
5. Em caso de erro: exibir toast com `sonner` e adicionar mensagem de erro no chat

**Toast de CRUD**: Quando a resposta do assistente contém padrões como "✅ Criado", "✅ Atualizado", "✅ Excluído", exibir um `toast.success()` com a mensagem

### 1.4 Modificar `src/components/layout/MainLayout.tsx`

- Importar `AIChatWidget` de `@/components/chat/AIChatWidget`
- Importar `useAuth` de `@/contexts/AuthContext`
- Renderizar `<AIChatWidget />` dentro do div principal, ANTES de `<UpgradeCTA />`, condicionado a `session !== null` (apenas para usuários autenticados)

### 1.5 Instalar dependência

- Adicionar `react-markdown` ao `package.json`

### 1.6 Registrar em `supabase/config.toml`

- Adicionar bloco `[functions.hub-assistant]` com `verify_jwt = false` (validação feita em código)

---

## FASE 2 — Novas Funcionalidades Nativas

### 2.1 Dashboard Inteligente — `src/components/dashboard/HealthSummary.tsx`

**O que faz**: Widget que aparece no topo do Painel Principal com 4 KPIs em tempo real.

**Dados**: Usar hooks existentes (`useTransacoes`, `useProjetos`, `useTarefas`, `useClientes`) para buscar dados.

**4 StatCards** (usar componente `StatCard` existente):
1. **Receita do Mês**: Filtrar `transacoes` do mês atual com `type === "receita"`, somar `value`. Ícone: `DollarSign`, variant: `success`
2. **Tarefas Vencidas**: Filtrar `tarefas` com `due_date < hoje` e `status === "pendente"`. Ícone: `AlertCircle`, variant: `destructive`
3. **Projetos Atrasados**: Filtrar `projetos` com `end_date < hoje` e `status !== "concluido"` e `status !== "cancelado"`. Ícone: `Clock`, variant: `warning`
4. **Clientes sem Contato (30d+)**: Filtrar `clientes` com `ultima_interacao < hoje - 30 dias` e `status === "ativo"`. Ícone: `UserCheck`, variant: `default`

**Layout**: `grid grid-cols-2 md:grid-cols-4 gap-4`

**Alertas inteligentes**: Abaixo dos cards, se houver projetos atrasados ou tarefas vencidas, exibir banner amarelo: "⚠️ {N} projetos vencem esta semana" / "⚠️ {N} tarefas estão atrasadas"

**Integração**: Adicionar `<HealthSummary />` em `src/pages/Index.tsx` entre o header e a seção "Módulos"

### 2.2 Notificações Internas

**Migração SQL** — criar tabela `notifications`:
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, warning, success, error
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

**`src/hooks/useNotifications.ts`**:
- Query: `supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)`
- Subscription realtime: `supabase.channel("notifications").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq.{userId}" }, callback).subscribe()`
- Mutations: `markAsRead(id)` → update `read = true`, `markAllAsRead()`, `deleteNotification(id)`
- Retornar `{ notifications, unreadCount, markAsRead, markAllAsRead }`

**`src/components/layout/NotificationBell.tsx`**:
- Ícone `Bell` do lucide com badge vermelho mostrando `unreadCount` (ocultar se 0)
- Ao clicar: abrir `Popover` com lista de notificações, cada uma com título, mensagem, timestamp relativo ("há 2h"), botão de marcar como lida
- Botão "Marcar todas como lidas" no footer do popover
- Posicionar no `Sidebar.tsx` ou no header do `MainLayout`

### 2.3 Relatórios Exportáveis — `src/components/export/ExportButtons.tsx`

**Props**: `{ data: any[], columns: { key: string, label: string }[], filename: string }`

**CSV**: Montar string CSV com headers + rows, criar `Blob("text/csv")`, gerar URL e acionar download via `<a>` programático

**PDF**: Usar abordagem client-side simples — gerar HTML formatado com os dados em tabela, abrir `window.print()` com CSS de impressão. Alternativa: usar `jspdf` + `jspdf-autotable` se já disponível.

**Integração**: Adicionar botões "Exportar CSV" e "Exportar PDF" nas páginas `Financas.tsx`, `Clientes.tsx` e `Projetos.tsx`, passando os dados já carregados pelos hooks.

### 2.4 Timeline de Atividades — `src/components/dashboard/ActivityTimeline.tsx`

**Dados**: Query à tabela `audit_log` do usuário: `supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(20)`

**Renderização**: Lista vertical com ícone por ação (create → `Plus`, update → `Edit`, delete → `Trash2`, login → `LogIn`), texto descritivo ("Você criou o cliente Fernando Almeida"), timestamp relativo

**Filtros**: Select para filtrar por módulo (todos, finanças, clientes, projetos...)

**Integração**: Adicionar na `Index.tsx` abaixo do grid Agenda + Mural, em seção nova "Atividade Recente"

---

## FASE 3 — Integrações Externas

### 3.1 Google (Gmail + Calendar)

**Migração SQL** — tabela `user_integrations`:
```sql
CREATE TABLE public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL, -- 'google'
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own integrations" ON public.user_integrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Secrets necessários**: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` — solicitar ao usuário via `add_secret` com instruções de como criar no Google Cloud Console (habilitar Gmail API e Calendar API, criar credencial OAuth2 Web, adicionar redirect URI).

**`supabase/functions/google-integration/index.ts`**:
- Endpoint POST com `action` no body:
  - `action: "auth_url"` → gerar URL de autorização Google OAuth2 com escopos `gmail.readonly gmail.send calendar.readonly calendar.events`, redirect_uri apontando para o próprio edge function com `action: "callback"`
  - `action: "callback"` → receber `code`, trocar por tokens via `https://oauth2.googleapis.com/token`, salvar na tabela `user_integrations`, redirecionar o usuário de volta para o Hub
  - `action: "list_emails"` → usar access_token para chamar `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`, retornar lista
  - `action: "send_email"` → receber `to, subject, body`, montar mensagem RFC 2822 em base64, POST para Gmail API
  - `action: "list_events"` → chamar Google Calendar API, retornar próximos 10 eventos
  - `action: "sync_events"` → ler eventos e inserir/atualizar na tabela `agenda_items`
- Refresh de token automático: antes de cada chamada à API Google, verificar se `token_expires_at < now()`, se sim, usar `refresh_token` para obter novo access_token

**`src/components/settings/IntegrationsPanel.tsx`**:
- Card "Google Workspace" com status (conectado/desconectado)
- Botão "Conectar Google" → chama edge function com `action: "auth_url"`, redireciona o usuário
- Se conectado: botões "Desconectar", "Sincronizar Agenda"
- Integrar essa tela no menu de configurações do usuário (UserMenu ou nova rota `/integracoes`)

### 3.2 WhatsApp (expansão)
- No `hub-assistant`, adicionar tool `send_whatsapp`:
  ```json
  { "name": "send_whatsapp", "parameters": { "to": "string (telefone)", "message": "string" } }
  ```
- Implementação: chamar `supabase.functions.invoke("send-whatsapp", { body: { to, message } })` de dentro do hub-assistant

### 3.3 Slack — `supabase/functions/slack-notify/index.ts`
- Verificar se conector Slack está disponível via `list_connections`
- Se sim: criar edge function que recebe `{ channel, text }` e posta via Slack API
- Integrar com notificações: ao criar notificação de tipo "warning", enviar também para Slack se configurado

### 3.4 Telegram
- Mesmo padrão do Slack mas via Bot API do Telegram (`https://api.telegram.org/bot<token>/sendMessage`)
- Secret necessário: `TELEGRAM_BOT_TOKEN`

---

## EVOLUÇÃO DOS BIs

### BI Financeiro (`FinanceiroBIPanel.tsx`) — Adicionar 4 seções

1. **DRE Simplificado**: Nova seção `<div>` após os KPIs. Tabela com linhas: Receita Bruta (soma receitas), (-) Despesas Operacionais (soma despesas com categoria "Infraestrutura","Pessoal","Operacional"), (=) Lucro Operacional, (-) Outras Despesas, (=) Lucro Líquido. Calcular tudo a partir do array `transacoes` filtrado por `selectedYear`.

2. **Top 5 Categorias de Despesa**: Agrupar transações `type === "despesa"` por `category`, somar valores, ordenar desc, pegar top 5. Renderizar como `BarChart` horizontal (mesmo estilo do MarketingBIPanel).

3. **Inadimplência**: Filtrar transações com `type === "receita"` e `status === "pendente"` e `date < hoje`. Card com total inadimplente e % sobre receita total.

4. **Ticket Médio**: `totalReceita / count(receitas)`. Exibir como KPI card adicional na grade existente (expandir de 3 para 4 colunas).

### BI Marketing (`MarketingBIPanel.tsx`) — Adicionar 3 seções

1. **Distribuição de Status**: `PieChart` (recharts) com contagem de campanhas por status (ativa, planejamento, pausada, concluida). Cores: success, primary, warning, muted.

2. **Investimento Mensal**: `AreaChart` com eixo X = meses, Y = soma de budgets de campanhas cujo `start_date` cai naquele mês. Gradiente azul.

3. **ROI por Campanha** (preparatório): Adicionar coluna no ranking existente mostrando "ROI: N/A" por enquanto. Quando campos de conversão forem adicionados à tabela `campanhas`, calcular `(conversions * ticket_medio - budget) / budget * 100`.

### BI Projetos (`ProjetosBIPanel.tsx`) — Adicionar 3 seções

1. **Distribuição por Prioridade**: `PieChart` com contagem de projetos por `priority` (alta, media, baixa). Cores: destructive, warning, muted.

2. **Taxa de Atraso**: Card KPI — contar projetos com `end_date < hoje` e `status !== "concluido"` dividido pelo total, exibir como %.

3. **Lead Time Médio**: Para projetos concluídos, calcular diferença média entre `end_date` e `start_date` em dias. Exibir como KPI card "Tempo Médio de Entrega: X dias".

### Novos BIs

**`src/components/bi/TarefasBIPanel.tsx`** — Dialog modal com:
- KPIs: Total, Pendentes, Concluídas, Vencidas
- `PieChart` de status (pendente, em_andamento, concluida)
- `BarChart` de tarefas por categoria
- Taxa de conclusão no prazo: `(concluidas_no_prazo / total_concluidas) * 100`
- Integrar na `Tarefas.tsx` com botão BarChart3 no header (mesmo padrão das outras páginas)

**`src/components/bi/RHBIPanel.tsx`** — Dialog modal com:
- KPIs: Headcount ativo, Folha salarial total, Salário médio
- `BarChart` de colaboradores por departamento
- `PieChart` de status (ativo, inativo, férias)
- Integrar na `RH.tsx`

---

## PRIORIDADE DE EXECUÇÃO

1. **Fase 1** (Agente IA) — 1 edge function + 2 componentes React + 1 dependência
2. **Fase 2.2** (Notificações) — 1 migração + 1 hook + 1 componente
3. **Fase 2.1** (Dashboard Inteligente) — 1 componente + modificar Index.tsx
4. **Evolução BIs** — modificar 3 arquivos existentes + criar 2 novos
5. **Fase 2.4** (Timeline) — 1 componente + modificar Index.tsx
6. **Fase 2.3** (Exportar) — 1 componente + modificar 3 páginas
7. **Fase 3** (Integrações) — requer secrets do usuário, fazer por último

---

## TABELA DE ARQUIVOS

| Arquivo | Ação | Fase |
|---------|------|------|
| `supabase/functions/hub-assistant/index.ts` | Criar (~400 linhas) | 1 |
| `supabase/config.toml` | Adicionar bloco `hub-assistant` | 1 |
| `src/components/chat/ChatMessage.tsx` | Criar | 1 |
| `src/components/chat/AIChatWidget.tsx` | Criar | 1 |
| `src/components/layout/MainLayout.tsx` | Modificar (adicionar widget) | 1 |
| `package.json` | Adicionar `react-markdown` | 1 |
| Migração: tabela `notifications` | Criar | 2.2 |
| `src/hooks/useNotifications.ts` | Criar | 2.2 |
| `src/components/layout/NotificationBell.tsx` | Criar | 2.2 |
| `src/components/dashboard/HealthSummary.tsx` | Criar | 2.1 |
| `src/pages/Index.tsx` | Modificar (health + timeline) | 2.1/2.4 |
| `src/components/dashboard/ActivityTimeline.tsx` | Criar | 2.4 |
| `src/components/export/ExportButtons.tsx` | Criar | 2.3 |
| `src/pages/Financas.tsx` | Modificar (botões export) | 2.3 |
| `src/components/bi/FinanceiroBIPanel.tsx` | Expandir (+4 seções) | BI |
| `src/components/bi/MarketingBIPanel.tsx` | Expandir (+3 seções) | BI |
| `src/components/bi/ProjetosBIPanel.tsx` | Expandir (+3 seções) | BI |
| `src/components/bi/TarefasBIPanel.tsx` | Criar | BI |
| `src/components/bi/RHBIPanel.tsx` | Criar | BI |
| `src/pages/Tarefas.tsx` | Modificar (integrar BI) | BI |
| `src/pages/RH.tsx` | Modificar (integrar BI) | BI |
| Migração: tabela `user_integrations` | Criar | 3.1 |
| `supabase/functions/google-integration/index.ts` | Criar | 3.1 |
| `src/components/settings/IntegrationsPanel.tsx` | Criar | 3.1 |
| `supabase/functions/slack-notify/index.ts` | Criar | 3.3 |

