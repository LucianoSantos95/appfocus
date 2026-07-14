# Correções pré-aprovação (Phase 2.6)

Duas correções pontuais antes de mandar para nova avaliação. Sem novas features, apenas fechar as regressões e o "chão visual" que ficaram.

## 1. Corrigir rota /tarefas (bloqueador)

A rota `/tarefas` retorna 404 na navegação. Provável regressão em `src/pages/Tarefas.tsx` após os últimos ajustes de header/motion (import quebrado, export default removido, ou erro em runtime que dispara o `ErrorBoundary` → 404).

**Ação:**
- Abrir `src/pages/Tarefas.tsx` e validar: `export default`, imports de `motion/index.tsx`, JSX raiz.
- Conferir se a rota continua registrada em `src/App.tsx` (`<Route path="/tarefas" ...>`).
- Rodar `tsgo` e navegar via Playwright para confirmar que a página renderiza o Kanban.

## 2. Empty states nos gráficos (Clientes e Projetos)

Hoje, quando não há dados, os cards de gráfico ficam como retângulos vazios — parece bug, não "sem dados".

**Ação:**
- Criar um pequeno wrapper `<ChartEmpty title icon>` (ou reusar `<EmptyState>` compacto) para exibir dentro do card quando `data.length === 0`.
- Aplicar em:
  - `src/pages/Clientes.tsx` → "Receita por Cliente" e "Por Segmento".
  - `src/pages/Projetos.tsx` → "Orçamento vs Gasto" e "Status dos Projetos".
  - Também na lista principal de Projetos (grid vazio) → renderizar `<EmptyState>` já existente.
- Manter animação de entrada (`FadeIn`) para consistência com a Home.

## Verificação

- `tsgo` limpo.
- Playwright: capturar Home, Finanças, Clientes, Projetos, **Tarefas** e confirmar visualmente:
  - `/tarefas` renderiza o Kanban.
  - Cards de gráfico vazios mostram mensagem + ícone.
- Se ok → aprovado para nova avaliação.

## Fora de escopo

- Chart draw-in animation, Kanban `layout` motion e demais itens Phase 3 ficam para depois da aprovação.
