## Fluid & Alive — Phase 2 do polish

Transformar a interface de **estática e correta** em **viva e memorável**, sem redesign visual.

### 1. Instalar framer-motion e display font
- Adicionar `framer-motion` (~50kb gzip, tree-shakeable).
- Adicionar **Space Grotesk** via Google Fonts (`display=swap`, preconnect no `index.html`).
- Atualizar `tailwind.config.ts`: `fontFamily.display = ['Space Grotesk', ...]`, manter `sans` como Inter.

### 2. Tipografia com hierarquia
- Aplicar `font-display` + `tracking-tight` em H1/H2 dos módulos e em números grandes (KPIs, HealthSummary, BI panels).
- Body/UI segue Inter (`font-sans` default).
- Ajustar pesos: display 600-700, body 400, muted 400.

### 3. Camada de movimento
Criar helpers reutilizáveis em `src/components/motion/`:
- **`<Stagger>`** e **`<StaggerItem>`**: wrapper para listas com entrada em cascata (delay 30-50ms). Aplicar em: Kanban Tarefas, cards de Clientes, cards de Projetos, cards de módulos do Home, cards de campanhas Marketing, contas bancárias Finanças.
- **`<FadeIn>`**: entrada com fade+translateY, respeita `prefers-reduced-motion`.
- **Substituir `RouteFade`**: nova transição com slide+fade coordenado usando `AnimatePresence` (200ms).
- **Modais/Dialogs**: sobrescrever transição do shadcn Dialog com spring (não fazer breaking change — apenas via variants).
- **Layout animations**: `layout` prop nos cards do Kanban para acomodação suave ao criar/mover/excluir.

### 4. Números vivos
- Criar `<CountUp value={n} />` (~40 linhas, sem lib externa; usa `requestAnimationFrame`, duração 800ms, easing ease-out).
- Aplicar em: HealthSummary, UsageLimitWidget, todos os KPIs dos BI panels (Finanças, Clientes, Marketing, Projetos, RH, Tarefas), cards de saldo de Finanças.
- Garantir `isAnimationActive={true}` em todos os `<Recharts>` (LineChart, BarChart, PieChart, AreaChart).

### 5. Micro-personalidade
- **Hero glow no Home**: radial gradient sutil atrás do H1 do painel principal (primary a 8%, blur 80px).
- **Sidebar ativa com `layoutId`**: barra lateral do item ativo desliza entre itens ao navegar (framer-motion `layoutId="sidebar-active"`).
- **AI Chat Widget**: `animate-pulse-subtle` no botão flutuante quando idle >30s.
- **UpgradeCTA / plano premium**: border com gradient conic girando lentamente (8s), CSS puro.

### 6. Feedback tátil
- **Success toast**: micro-bounce no ícone de check (scale 1 → 1.2 → 1, 400ms).
- **Copy-to-clipboard**: onde existir, ícone morfa copy → check por 1.2s.
- **Botão destrutivo** (`variant="destructive"`): shake sutil no hover (translate-x -1px → 1px, 120ms).

### O que NÃO muda
- Paleta de cores (azul elétrico segue).
- Layout dos módulos.
- Backend, hooks, RLS, edge functions, schemas.
- Nenhuma feature funcional nova.

### Detalhes técnicos
- Dep nova: `framer-motion` apenas.
- Nova font: Space Grotesk (display), Inter mantida (body).
- Todas as animações respeitam `@media (prefers-reduced-motion: reduce)`.
- Componentes de movimento centralizados em `src/components/motion/` para reuso.
- Sem edições em `src/integrations/supabase/*`, hooks de dados, ou edge functions.

### Arquivos principais a editar/criar
```
NOVO  src/components/motion/Stagger.tsx
NOVO  src/components/motion/FadeIn.tsx
NOVO  src/components/motion/CountUp.tsx
NOVO  src/components/motion/PageTransition.tsx  (substitui RouteFade)
EDIT  index.html                                (preconnect + Space Grotesk)
EDIT  tailwind.config.ts                        (fontFamily.display)
EDIT  src/index.css                             (hero-glow, conic-border, bounce keyframes)
EDIT  src/App.tsx                               (RouteFade → PageTransition)
EDIT  src/components/layout/Sidebar.tsx         (layoutId no item ativo)
EDIT  src/components/chat/AIChatWidget.tsx     (idle pulse)
EDIT  src/components/plan/UpgradeCTA.tsx       (conic border)
EDIT  src/pages/Index.tsx                       (hero glow, font-display no H1, Stagger nos módulos)
EDIT  src/pages/{Tarefas,Clientes,Projetos,Financas,Marketing,RH}.tsx  (Stagger + font-display)
EDIT  src/components/dashboard/HealthSummary.tsx, UsageLimitWidget.tsx  (CountUp)
EDIT  src/components/bi/*.tsx                   (CountUp nos KPIs)
```

Pronto para implementar.
