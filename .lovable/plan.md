

## Plano de Segurança — 4 Implementações

### 1. Rate Limiting no Login
- Criar uma tabela `login_attempts` no banco para rastrear tentativas por email
- Criar uma função SQL `check_login_rate_limit(email)` que verifica se houve mais de 5 tentativas nos últimos 5 minutos
- Criar edge function `check-rate-limit` que o frontend chama antes de `signIn`
- No `AuthContext.signIn`, chamar a edge function antes de autenticar; se bloqueado, retornar erro com tempo restante
- Trigger automático para limpar registros antigos (>1 hora)

### 2. Validação com Zod em Todos os Formulários
- Instalar `zod` como dependência
- Criar `src/lib/schemas.ts` com schemas para cada módulo:
  - `clienteSchema`, `projetoSchema`, `tarefaSchema`, `processoSchema`, `colaboradorSchema`, `transacaoSchema`, `campanhaSchema`, `conteudoSchema`, `contaBancariaSchema`, `feedbackSchema`, `supportSchema`
- Atualizar os `handleSubmit` em cada página/componente (Clientes, Projetos, Tarefas, Processos, RH, Financas, Marketing, ContentCalendar, FeedbackDialog, SupportDialog) para validar com `schema.safeParse()` antes de enviar
- Exibir mensagens de erro granulares via toast

### 3. Audit Log
- Criar tabela `audit_log` com colunas: `id`, `user_id`, `action` (login, create, update, delete), `module`, `record_id`, `details` (jsonb), `ip_address`, `created_at`
- RLS: usuários veem só seus logs; admins veem todos
- Criar função SQL `log_audit_event(action, module, record_id, details)` usando `SECURITY DEFINER`
- Criar hook `useAuditLog` no frontend que chama essa função via RPC após ações críticas (login, criação, edição, exclusão em cada módulo)
- Adicionar chamada ao audit log nos hooks existentes (`useClientes`, `useProjetos`, `useTarefas`, etc.)

### 4. Sanitização HTML (DOMPurify)
- Instalar `dompurify` e `@types/dompurify`
- Criar `src/lib/sanitize.ts` com helper `sanitizeHtml(input)`
- Aplicar sanitização no `MeetingNotesEditor.tsx` (que usa `dangerouslySetInnerHTML`)
- Aplicar sanitização em todos os campos de texto livre antes de salvar no banco (notas de clientes, descrições de projetos, bulletin notes, etc.)

### Ordem de Execução
1. Rate Limiting → 2. Zod Validation → 3. Audit Log → 4. DOMPurify

### Arquivos Impactados
- **Novos**: `src/lib/schemas.ts`, `src/lib/sanitize.ts`, `src/hooks/useAuditLog.ts`, `supabase/functions/check-rate-limit/index.ts`, 3 migrations SQL
- **Editados**: `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`, `src/pages/Clientes.tsx`, `src/pages/Projetos.tsx`, `src/pages/Tarefas.tsx`, `src/pages/Processos.tsx`, `src/pages/RH.tsx`, `src/pages/Financas.tsx`, `src/pages/Marketing.tsx`, `src/components/marketing/ContentCalendar.tsx`, `src/components/user/FeedbackDialog.tsx`, `src/components/user/SupportDialog.tsx`, `src/components/clientes/MeetingNotesEditor.tsx`, hooks de cada módulo

