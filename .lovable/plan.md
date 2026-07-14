## Phase 2.5 — Consistência + Wow nos módulos

O Phase 2 elevou Home/sidebar/chat, mas os módulos onde o usuário passa a maior parte do tempo (Finanças, Clientes, Tarefas, Projetos, Marketing, RH) continuam com tipografia e estática de "template SaaS". Este plano fecha essa lacuna.

### 1. KPI unificado — extrair `<KPIStat>`
Hoje os módulos usam blocos custom tipo `<p className="text-2xl font-bold">R$ 11.700</p>`. Criar componente único `<KPIStat value={number} format="currency|number|percent" label icon variant />` que:
- Usa `font-display tracking-tight tabular-nums`.
- Aplica `<CountUp>` automaticamente.
- Formata pt-BR (currency, percent, número compacto tipo "12k").
- Substituir os KPIs custom em: **Finanças** (Receita/Despesa/Lucro/Caixa), **Clientes** (topo do BI), **Projetos** (BI), **RH** (BI), **Marketing** (BI), **Tarefas** (BI).

### 2. Gráficos com draw-in
Recharts suporta animação nativa via `isAnimationActive`, `animationDuration`, `animationBegin`. Padronizar:
- `animationDuration={900}`, easing `ease-out`.
- Aplicar em todos os `<LineChart>`, `<AreaChart>`, `<BarChart>`, `<PieChart>` de: Finanças (Evolução, Por Categoria), Clientes (Receita/Segmento), Marketing (Funil), Projetos (Status), RH (headcount), BI panels.
- Adicionar `<FadeIn delay={0.1}>` ao container do card do gráfico pra ele entrar já com o card.

### 3. Stagger nos módulos principais
Aplicar `<Stagger>/<StaggerItem>` em:
- **Tarefas**: colunas do Kanban e cards dentro de cada coluna (entrada 40ms cascata).
- **Clientes**: grid de cards de prospecto/ativo.
- **Projetos**: cards de projeto.
- **Finanças**: linhas da tabela de transações (primeira renderização) + cards de contas bancárias.
- **Marketing**: cards de campanha nas 4 tabs.

### 4. Empty states com personalidade
Atualizar `<EmptyState>` para usar `font-display` no title e adicionar entrada com scale+fade (framer-motion). Aplica automaticamente em todos os empty states já existentes.

### 5. Cards clicáveis com layout animation
Ativar `layout` prop do framer-motion em cards de:
- Kanban Tarefas (acomodam ao mover entre colunas).
- Lista de campanhas (acomodam ao arquivar/mudar status).
- Contas bancárias (acomodam ao adicionar/remover).

### 6. Tipografia display em títulos de card e seção
Sweep global: `text-lg font-semibold` e `text-xl font-bold` de títulos de card/section nos módulos → `font-display tracking-tight`. Regex-guided, ~30-40 ocorrências.

### O que NÃO muda
- Nenhuma mudança em dados, hooks, RLS, edge functions.
- Sem redesign de layout.
- Sem nova dependência (framer-motion + Space Grotesk já instalados).

### Detalhes técnicos
- Novo: `src/components/ui/kpi-stat.tsx` (~40 linhas, wraps CountUp + formatação pt-BR).
- Edit: `src/components/ui/empty-state.tsx` (motion + font-display).
- Edit: `src/pages/Financas.tsx`, `src/pages/Clientes.tsx`, `src/pages/Tarefas.tsx`, `src/pages/Projetos.tsx`, `src/pages/RH.tsx`, `src/pages/Marketing.tsx` — trocar KPIs custom por `<KPIStat>`, envolver listas em `<Stagger>`, aplicar font-display em títulos de seção.
- Edit: `src/components/bi/*.tsx` — mesmo tratamento nos BI panels.
- Edit: Charts em Finanças, BI panels — props de animação padronizadas.

### Resultado esperado
Ao terminar, qualquer módulo aberto vai:
- Ter números que sobem em vez de "aparecerem".
- Ter cards que entram em cascata.
- Ter tipografia display consistente com o Home.
- Ter gráficos que se desenham.

Pronto para implementar.
