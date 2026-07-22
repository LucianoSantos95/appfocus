## 1. Diminuir levemente logo + wordmark na landing

`src/components/landing/LandingNav.tsx`:
- Logo `h-12` → `h-10`
- Texto `text-xl md:text-2xl` → `text-lg md:text-xl`
- Mantém o `font-bold tracking-tight` e o resto do layout.

## 2. Dashboard demo: injetar fixtures nos widgets que hoje falam direto com Supabase

Hoje os módulos (Clientes, Projetos, Tarefas, Financeiro, RH, Marketing, Processos) já enxergam os dados demo via `sharedResource.ts` + `demo-fixtures.ts`. O que aparece vazio é o **Dashboard** (rota `/`), porque estes componentes usam `supabase.from(...)` direto, fora do cache com fixtures:

- `src/components/dashboard/AgendaWidget.tsx` — em modo demo, popular `items` com `demoAgenda` e pular o fetch. Mutations (add/edit/delete) exibem toast "Ação desabilitada no modo demonstração".
- `src/components/dashboard/BulletinBoard.tsx` — mesmo padrão com `demoBulletin`.
- `src/components/dashboard/IntegrationsPulse.tsx` — em modo demo, montar um estado sintético mostrando Google conectado (com "3 eventos criados"), Slack conectado (com "5 alertas enviados"), Firecrawl "12 leads enriquecidos".
- `src/components/dashboard/ActivityTimeline.tsx` — em modo demo, retornar 6 eventos fictícios (cliente criado, projeto atualizado, tarefa concluída, transação registrada, colaborador adicionado, campanha lançada) datados nos últimos 7 dias.
- `src/components/dashboard/HealthSummary.tsx` — se ele calcular via `supabase.from`, forçar valores derivados dos fixtures em modo demo (MRR, clientes ativos, tarefas atrasadas, projetos em andamento) — verificar no arquivo se já usa hooks; se sim, nada a fazer.
- `src/components/dashboard/SetupGuide.tsx` — em modo demo, esconder (retornar `null`) já que o guia pede login real.
- `src/components/dashboard/DashboardHero.tsx` — se lê Supabase direto, popular com os totais dos fixtures (receita 11.090, despesa 20.330, 7 clientes, 6 projetos).

Padrão de implementação (em todos): no `useEffect` que dispara `fetchItems`, verificar `isDemoMode()` e curto-circuitar com o fixture, `setLoading(false)`. Mutations viram `if (isDemoMode()) { toast(...); return; }`.

## 3. Fixtures adicionais necessários

Adicionar em `src/lib/demo-fixtures.ts`:
- `demoActivityTimeline` — 6 entradas com `{ action, module, created_at, actor_name }`.
- `demoIntegrationsPulse` — objeto com status de Google/Slack/Firecrawl + métricas.
- Exportar helpers `demoHealthMetrics` calculando totais a partir dos fixtures existentes.

## 4. Fora de escopo (não mexer)

- Asaas / Stripe / Google / Slack / Firecrawl edge functions.
- Autenticação real, migrations, MCP.
- Estrutura das listas (o "Ver mais / 5 primeiros" continua igual).
- Sidebar do app logado, tema.

## Detalhes técnicos

- `isDemoMode()` já disponível em `@/lib/demo-fixtures`; usar no início dos `useEffect` para curto-circuito.
- Nenhuma request ao Supabase pode disparar em modo demo — evita erros de RLS e ruído no console.
- Todos os `handleAdd/handleEdit/handleDelete` em widgets devem chamar `toast` de "Ação desabilitada no modo demonstração" e retornar cedo, sem chamar `supabase`.
