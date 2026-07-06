# Plano: Login de Demonstração para Avaliadores Lovable

## Objetivo
Criar uma conta demo pré-populada com dados realistas e acesso total (plano Enterprise/Admin) para que avaliadores da certificação Lovable Partner possam explorar todas as funcionalidades do Hub sem precisar cadastrar-se.

## Credenciais propostas
- **Email:** `demo@focusinteligente.com.br`
- **Senha:** `LovableDemo2026!`

(Confirme se prefere outras credenciais antes de eu implementar.)

## O que será feito

### 1. Criação da conta no backend
- Inserir usuário em `auth.users` com email já confirmado (via `supabase--insert` usando funções admin).
- O trigger `handle_new_user` cria automaticamente `profiles` + `subscriptions` (gratuito) + `user_roles` (user) + demo data básica.

### 2. Elevar privilégios da conta demo
- Atualizar `subscriptions` para plano **Enterprise** com status `active` (sem limite freemium, sem gates).
- Adicionar role `admin` em `user_roles` para liberar painéis administrativos (Assinantes, BI completo, MCP tools de vendas).

### 3. Popular com dados ricos de demonstração
Além do que o trigger `populate_demo_data` já injeta, adicionar volume extra para as telas parecerem "vividas":
- +10 clientes (mix prospectos/ativos com valores variados)
- +8 projetos em diferentes estágios (kanban preenchido)
- +15 tarefas distribuídas por prioridade/status
- +20 transações financeiras (receitas e despesas dos últimos 90 dias) para gráficos de BI mostrarem tendências
- +5 colaboradores adicionais
- +3 campanhas de marketing com conteúdos agendados
- +2 processos documentados
- Marcar onboarding como concluído (`onboarding_progress`) para evitar prompts

### 4. Exibir credenciais na tela de login
- Adicionar um card discreto em `src/pages/Auth.tsx` (visível apenas na tela pública) com:
  - Título "🎓 Avaliador Lovable Partner"
  - Email e senha em destaque
  - Botão **"Entrar como avaliador"** que preenche e submete o formulário automaticamente
- Design alinhado ao tema dark premium do projeto

### 5. Proteção da conta demo
- Impedir que a conta demo seja excluída ou tenha senha alterada acidentalmente (opcional — via política ou apenas documentado).

## Detalhes técnicos

**Migração / Insert SQL:**
```sql
-- 1. Criar usuário via função admin (email pré-confirmado)
-- 2. UPDATE subscriptions SET plan='enterprise', status='active' WHERE user_id=<demo>
-- 3. INSERT INTO user_roles (user_id, role) VALUES (<demo>, 'admin')
-- 4. Bulk INSERT em clientes/projetos/tarefas/transacoes/colaboradores/campanhas
-- 5. UPDATE onboarding_progress SET completed=true
```

**Frontend (`src/pages/Auth.tsx`):**
- Novo componente `DemoLoginCard` renderizado abaixo do formulário principal
- Handler que chama `signIn(demoEmail, demoPassword)` diretamente

## Fora de escopo
- Reset automático diário dos dados demo (podemos adicionar depois se quiser proteger contra alterações dos avaliadores)
- Múltiplas contas demo por role (uma única conta admin cobre todos os cenários)

## Confirme antes de eu implementar
1. Credenciais sugeridas estão OK?
2. Quer o botão "Entrar como avaliador" visível para qualquer visitante da `/auth`, ou apenas quando um parâmetro `?demo=1` estiver na URL (mais discreto)?
