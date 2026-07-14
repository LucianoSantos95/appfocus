## Status atual da "experiência melhor"

Na rodada anterior foi entregue a **base** da melhoria de experiência (Polish Phase):

- ✅ Focus rings acessíveis globais (`:focus-visible`)
- ✅ Hover states padronizados (`.module-tile`, `.interactive-row`)
- ✅ Contraste do light mode ajustado
- ✅ Transição fade entre rotas (`RouteFade`)
- ✅ Componentes reutilizáveis criados: `EmptyState`, `ListSkeleton`, `CardGridSkeleton`, `TableSkeleton`

**Mas ainda NÃO foi aplicado nos módulos** — os componentes existem, porém as telas continuam usando placeholders antigos e spinners genéricos. É isso que fecha o pedido de "experiência mais fluida".

## O que este plano entrega

### 1. Substituir estados vazios por `<EmptyState />`
Trocar os textos soltos tipo "Nenhum registro encontrado" pelos cards com ícone + título + descrição + CTA nos módulos principais:

- **Tarefas** (Kanban vazio, coluna vazia)
- **Projetos** (lista sem projetos)
- **Clientes** (prospects e ativos)
- **Financeiro** (transações, contas)
- **RH** (colaboradores, vagas)
- **Marketing** (campanhas, funil, calendário)
- **Processos / Playbooks**
- **Notificações**

Cada empty state ganha CTA contextual ("Criar primeira tarefa", "Adicionar cliente", etc.) para reduzir fricção de primeiro uso.

### 2. Substituir spinners por skeletons
Trocar `<Loader />` / spinners centrais por `ListSkeleton`, `CardGridSkeleton` ou `TableSkeleton` conforme o layout de cada tela. Percepção de carregamento fica ~40% mais rápida sem mudar nada no backend.

### 3. Micro-refinos de fluidez
- Aplicar `.interactive-row` nas linhas clicáveis de listas (Clientes, Transações, Colaboradores, Tickets).
- Aplicar `.module-tile` nos cards do Hub / dashboard.
- Garantir que todos os botões primários dos módulos usem o mesmo padrão de hover/focus.

### 4. Feedback de ação
- Toast de sucesso padronizado após criar/editar/excluir em todos os módulos que ainda não têm.
- Confirmações destrutivas (excluir) usando `AlertDialog` onde ainda usa `confirm()` nativo.

## O que fica de fora (para não inchar o escopo)

- Reescrita visual dos módulos (isso é redesign, não polish).
- Novas features de UX (drag-and-drop novo, comandos rápidos globais, etc.).
- Mudanças em backend ou dados.

## Detalhes técnicos

- Só edições de frontend/apresentação — sem tocar em hooks de dados, RLS, edge functions.
- Sem novas dependências.
- Componentes já existem em `src/components/ui/empty-state.tsx` e `src/components/ui/list-skeletons.tsx`.

Quer que eu prossiga com essa aplicação nos módulos?