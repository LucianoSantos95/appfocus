
## 1. Logo e wordmark maiores na landing

Em `src/components/landing/LandingNav.tsx`:
- Aumentar o ícone/logo do Hub (~+40%) e o texto "Hub Empresarial" (fonte maior, mais peso). Sem alterações no sidebar do app logado.

## 2. Modo demo anônimo (sem login, read-only)

Trocar `handleDemoLogin` da landing por navegação para uma nova rota `/demo` — nada de Supabase, nada de conta compartilhada.

**Novos arquivos:**
- `src/contexts/DemoModeContext.tsx` — provider global expondo `isDemoMode: boolean`. Ligado quando a rota começa com `/demo` OU quando existe flag `sessionStorage.demo_mode`.
- `src/lib/demo-fixtures.ts` — datasets fictícios completos (clientes, projetos, tarefas, transações, colaboradores, campanhas, conteúdos, processos, agenda, mural, contas bancárias) reaproveitando a estrutura já usada em `populate_demo_data`.
- `src/pages/DemoEntry.tsx` — seta `sessionStorage.demo_mode=1`, redireciona para `/`.
- `src/components/demo/DemoBanner.tsx` — barra fixa no topo: "Modo demonstração · dados fictícios · sair da demo".

**Integração:**
- `src/App.tsx`: envolver árvore com `DemoModeProvider`; adicionar rota `/demo`; permitir acesso a rotas protegidas quando `isDemoMode` (ajuste em `ProtectedRoute.tsx`).
- Hooks de dados (`useClientes`, `useProjetos`, `useTarefas`, `useTransacoes`, `useColaboradores`, `useCampanhas`, `useConteudos`, `useProcessos`, `useContasBancarias`, e a agenda/mural do dashboard): early-return retornando os fixtures quando `isDemoMode`, sem chamar Supabase; funções de mutation viram no-ops que exibem toast "Ação desabilitada no modo demonstração".
- `AuthContext`: quando em demo, `user` fica como objeto sintético `{ id: "demo", email: "demo@..." }` só para o layout renderizar.
- `UserMenu`: em demo, botão "Sair" chama `sessionStorage.removeItem` e navega para `/auth`.
- Botões críticos (novo cliente, nova tarefa, etc.): usar um hook `useDemoGuard()` que desabilita o botão com tooltip "Somente leitura na demo".

## 3. Limite "5 primeiros + Ver mais" em todas as listas do app

Criar componente reutilizável `src/components/ui/ExpandableList.tsx`:
```tsx
<ExpandableList items={rows} initialCount={5} renderItem={(row) => <Card ... />} />
```
Renderiza os 5 primeiros; se `items.length > 5`, mostra botão "Ver mais (N)" que expande para todos. Estado local.

Aplicar nas listas/grids principais:
- Clientes (grid e kanban — no kanban, 5 por coluna)
- Projetos (mesmo padrão)
- Tarefas (por coluna do kanban)
- Finanças → transações
- RH → colaboradores
- Marketing → campanhas e conteúdos
- Processos
- Dashboard → agenda e mural

Não afeta gráficos/BI (que já usam agregados).

## 4. Cards de Módulos com título + descrição (estilo do print)

Em `src/components/landing/ModulesGrid.tsx`, ajustar cada item para ter `eyebrow` (em teal mono uppercase), `title` (Instrument Serif ou Work Sans bold) e `desc` (uma frase objetiva). Mantém os ícones atuais. Copy conforme o print:

- **FINANÇAS** — Feche o mês em minutos — Importe o OFX, veja DRE, fluxo e inadimplência prontos.
- **CLIENTES** — Nunca perca um follow-up — CRM com IA que classifica e enriquece cada cliente.
- **PROJETOS** — Entregue no prazo — Kanban com prazos, orçamento e responsáveis.
- **TAREFAS** — Organize a rotina — To-dos, prioridades e acompanhamento da operação.
- **MARKETING** — Planeje o conteúdo — Calendário editorial e campanhas por cliente.
- **RH · PROCESSOS** — Padronize a casa — Equipe, documentos e playbooks documentados.

Ajustar grid para `sm:grid-cols-2 lg:grid-cols-3` (já é) e altura uniforme.

## Detalhes técnicos

- Nenhuma mudança de schema, nenhum edge function tocado, nenhuma migration. Asaas/Stripe/Google/Slack intocados.
- `DemoModeContext` precede `AuthProvider` na árvore para que `AuthContext` possa consultar `isDemoMode` sem loop (ou usar leitura direta de `sessionStorage` no `AuthContext` para evitar dependência circular).
- `ExpandableList` respeita `prefers-reduced-motion`; expansão com `AnimatePresence` leve.
- Rota `/demo` limpa qualquer sessão Supabase antes de setar a flag, garantindo que um usuário logado que clica em "Ver demo" entra em modo demo isolado.

## Fora de escopo (não faremos agora)

- Popular novos dados no banco.
- Alterar sidebar/tema do app.
- Mudar comportamento das listas em contexto read-only pré-existente (BI, admin).
