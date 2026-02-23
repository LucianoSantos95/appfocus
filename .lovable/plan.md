

# Sprint 2 - O Lancamento (Final de Fevereiro)

## Visao Geral

Preparar o Hub Empresarial para lancamento comercial com autenticacao, controle de planos por funcionalidade (variando por modulo), gestao de colaboradores com convite por email, e experiencia profissional completa.

---

## Parte 1 - Banco de Dados (Fundacao)

### 1.1 Tabela `profiles`
Armazena dados do usuario (nome, avatar, telefone, plano atual).
- Trigger automatico para criar perfil no signup
- RLS: usuario so acessa proprio perfil

### 1.2 Tabela `user_roles` (Seguranca)
Tabela separada para roles (admin, user) seguindo padrao de seguranca contra escalacao de privilegios.
- Funcao `has_role()` com SECURITY DEFINER para evitar recursao em RLS
- Role "admin" atribuida automaticamente ao dono da conta

### 1.3 Tabela `subscriptions`
Controle do plano ativo do usuario (plano, status, datas de inicio/fim, stripe_customer_id para futuro).

### 1.4 Tabela `plan_features`
Mapeamento flexivel de quais funcionalidades cada plano libera, variando por modulo. Exemplo:

```text
plano: "plus"    | modulo: "financas"  | acao: "create" | liberado: true
plano: "plus"    | modulo: "financas"  | acao: "export" | liberado: false
plano: "pro"     | modulo: "financas"  | acao: "export" | liberado: true
plano: "gratuito"| modulo: "financas"  | acao: "create" | liberado: false
```

Voce podera personalizar essa tabela por modulo apos a implementacao.

### 1.5 Tabela `team_members`
Colaboradores convidados pelo admin (owner_id, member_email, member_user_id, status: pendente/aceito).

### 1.6 Tabela `team_member_permissions`
Permissoes por pagina de cada colaborador (team_member_id, page_slug).

### 1.7 Tabela `support_tickets`
Tickets de suporte (user_id, nome, email, telefone, mensagem, status).

### 1.8 Tabela `invite_tokens`
Tokens unicos para convites por email (token, team_member_id, expires_at, used_at).

### 1.9 Vincular dados orfaos
- Os 7 registros existentes na tabela `clientes` sem `user_id` serao vinculados automaticamente ao primeiro administrador que fizer login, garantindo que nenhum dado seja perdido.

---

## Parte 2 - Autenticacao

### 2.1 Reativar autenticacao no App.tsx
- Restaurar AuthProvider e ProtectedRoute
- Adicionar rotas `/auth`, `/planos`, `/termos`, `/privacidade`

### 2.2 Tela de Login/Cadastro (`/auth`)
- **Aba "Entrar"**: Email/senha + botao "Entrar com Google"
- **Aba "Cadastrar"**: Nome, email, senha e confirmacao + checkbox obrigatorio de aceite dos Termos
- **CTA abaixo do cadastro**: Banner "Desbloqueie todos os recursos - Conheca o Plano Plus"
- **Suporte a convite**: Rota `/auth?invite=TOKEN` para convidados criarem conta e serem vinculados ao time

### 2.3 Convite por Email
- Admin adiciona colaborador no painel
- Edge Function `send-invite` envia email automatico com link unico
- Convidado clica no link, cria conta e e vinculado ao time com permissoes pre-definidas

---

## Parte 3 - Sistema de Planos e Restricoes (Varia por Modulo)

### 3.1 Logica de Planos
Cada plano libera funcionalidades especificas em cada modulo, configuravel via tabela `plan_features`.

**Exemplo de distribuicao:**

| Funcionalidade | Gratuito | Plus (R$119) | Pro (R$249) | Enterprise (R$497) |
|---|---|---|---|---|
| Navegar modulos | Sim | Sim | Sim | Sim |
| Criar/editar dados | Nao | Sim | Sim | Sim |
| Exportar relatorios | Nao | Nao | Sim | Sim |
| Analise IA (Clientes) | Nao | Nao | Sim | Sim |
| Integracao API/Zapier | Nao | Nao | Nao | Sim |
| Limite de usuarios | 1 | 5 | 10 | Ilimitado |
| **Guia de Uso** | **Sim** | **Sim** | **Sim** | **Sim** |

**IMPORTANTE**: O Guia de Uso (`/guia`) fica acessivel para TODOS os planos, sem restricao.

### 3.2 Componente `PlanGate`
- Verifica permissao do usuario consultando `plan_features`
- Se bloqueado: popup "Esta funcionalidade esta disponivel no plano [nome]. Faca upgrade!"
- Nao aplicado ao Guia de Uso

### 3.3 CTA no Rodape Direito
- Visivel apenas para usuarios Gratuito
- "Desbloqueie os recursos assinando o plano Plus"

### 3.4 Pagina de Planos (`/planos`)
- Cards lado a lado: Plus, Pro, Enterprise
- Toggle mensal/anual com desconto
- Badge "Mais popular" no Pro
- CTAs claros em cada card

---

## Parte 4 - Menu do Usuario (Avatar na Sidebar)

### 4.1 Posicionamento
- Avatar circular no rodape da sidebar, acima de "Hub Empresarial v1.0"

### 4.2 Opcoes do Menu
1. **Perfil** - Editar nome, senha e foto
2. **Admin** - Gerenciar colaboradores (adicionar, permissoes, excluir)
3. **Faturamento** - Plano atual, proximo pagamento (preparado para Stripe)
4. **Feedback** - Formulario de feedback (movido do painel)
5. **Suporte** - Formulario com nome, email, telefone e mensagem
6. **Sair** - Logout

### 4.3 Rodape do Menu
- Email: comercial@focusinteligente.com.br

---

## Parte 5 - Painel Admin

### 5.1 Adicionar Colaborador
- Campo para email do convidado
- Checkboxes de permissao por pagina: Financas, RH, Marketing, Projetos, Clientes, Atividades, Processos, Guia
- Opcao "Todas as Paginas"
- Limite validado pelo plano

### 5.2 Email de Convite Automatico
- Edge Function `send-invite` dispara email com nome do admin, empresa e link unico
- Link redireciona para `/auth?invite=TOKEN`
- Apos cadastro, vinculacao automatica ao time

### 5.3 Listar e Gerenciar Colaboradores
- Lista com status (pendente/aceito)
- Editar permissoes e excluir

### 5.4 Controle de Acesso por Pagina
- Paginas sem acesso: icone de cadeado na sidebar
- Ao clicar: "Voce nao tem acesso a este modulo. Fale com o administrador."

---

## Parte 6 - Sidebar Responsiva

### 6.1 SidebarContext
- Compartilhar estado collapsed entre Sidebar e MainLayout
- Sidebar recolhida: `ml-16` / Expandida: `ml-64`
- Transicao suave

---

## Parte 7 - Suporte e Feedback

### 7.1 Suporte (menu do usuario)
- Campos: Nome, Email, Telefone, Mensagem
- Salvo em `support_tickets`

### 7.2 Feedback (movido do painel para o menu)
- Remover FeedbackWidget/FeedbackPopup do painel principal

---

## Parte 8 - Sugestoes Incluidas

### 8.1 Onboarding pos-cadastro
- Wizard de 3 passos: nome da empresa, segmento, quantidade de funcionarios

### 8.2 Empty States com CTAs
- Ilustracao + CTA claro quando nao ha dados ("Cadastre seu primeiro cliente")

### 8.3 Notificacoes por Email
- Email de boas-vindas apos cadastro (Edge Function `welcome-email`)

### 8.4 Paginas "Em Breve"
- Cards com badge "Em breve" para modulos futuros (Fiscal, Integracao API)

### 8.5 Termos de Uso e Politica de Privacidade
- Paginas `/termos` e `/privacidade`
- Link no rodape + checkbox no cadastro
- Conteudo placeholder para personalizar

---

## Parte 9 - Guia de Uso Expandido

- Secao detalhada para cada modulo com passo a passo
- Instrucoes do painel admin, suporte, perfil e planos
- **Acessivel para TODOS os planos, sem restricao**

---

## Lembrete Importante

Antes de iniciar a implementacao:
- Exportar dados da tabela `feedbacks` para enviar email promocional (Plus gratuito por periodo) aos usuarios que deixaram feedback
- Tirar o site do ar durante a implementacao

---

## Secao Tecnica

### Novas Tabelas (Migracoes SQL)

```text
profiles                  - Perfil do usuario
user_roles                - Roles (admin, user)
subscriptions             - Plano ativo
plan_features             - Funcionalidades x plano x modulo
team_members              - Colaboradores convidados
team_member_permissions   - Permissoes por pagina
support_tickets           - Tickets de suporte
invite_tokens             - Tokens de convite
```

### Novos Arquivos

```text
src/pages/Planos.tsx
src/pages/Termos.tsx
src/pages/Privacidade.tsx
src/components/user/UserMenu.tsx
src/components/user/ProfileDialog.tsx
src/components/user/AdminPanel.tsx
src/components/user/BillingPanel.tsx
src/components/user/SupportDialog.tsx
src/components/user/FeedbackDialog.tsx
src/components/plan/PlanGate.tsx
src/components/plan/UpgradeCTA.tsx
src/components/onboarding/OnboardingWizard.tsx
src/components/layout/SidebarContext.tsx
src/contexts/PlanContext.tsx
src/hooks/usePlanFeatures.ts
src/hooks/useTeamPermissions.ts
supabase/functions/send-invite/index.ts
supabase/functions/welcome-email/index.ts
```

### Arquivos Modificados

```text
src/App.tsx
src/components/layout/Sidebar.tsx
src/components/layout/MainLayout.tsx
src/pages/Auth.tsx
src/pages/Index.tsx
src/pages/Guia.tsx
src/contexts/AuthContext.tsx
Todos os modulos (Financas, RH, etc.)
```

### Ordem de Implementacao

1. Migracoes de banco de dados (todas as tabelas + RLS + triggers + vincular dados orfaos)
2. Reativar autenticacao + Google OAuth + profiles
3. Contexto de plano (PlanContext + usePlanFeatures)
4. Sidebar responsiva (SidebarContext)
5. Menu do usuario (avatar + dropdown)
6. Perfil, Admin (com convite por email), Faturamento
7. Edge Functions (send-invite, welcome-email)
8. Pagina de Planos
9. PlanGate + CTA rodape (excluindo Guia de Uso)
10. Controle de acesso por pagina (cadeados na sidebar)
11. Suporte e Feedback (movido)
12. Onboarding wizard
13. Empty states em todos os modulos
14. Paginas Em Breve, Termos e Privacidade
15. Guia de Uso expandido

