
## Diagnóstico

O motivo real de o dashboard aparecer com R$ 0 / 0 tarefas / 0/20 é que o `AuthProvider` monta **antes** do usuário clicar em "Ver demo". Quando `DemoEntry` seta `sessionStorage.demo_mode=1` e chama `navigate("/")`, o `AuthContext` já está em execução com o valor inicial `demo=false` capturado no primeiro render — nunca troca o `user` para o `DEMO_USER` sintético.

Sem `user`, todos os hooks (`useTransacoes`, `useClientes`, `useProjetos`, `useTarefas`, `useCampanhas`, `useConteudos`, `useColaboradores`, `useProcessos`, `useContasBancarias`) ficam com `enabled: false` e retornam `[]`. Fixtures existem no `demo-fixtures.ts` mas nunca chegam a ser consultadas.

Além disso o `PlanContext` fica em `gratuito`, então o BI (`PlanGate module="bi"`) aparece bloqueado com cadeado.

## O que fazer

### 1. Boot correto do modo demo (`src/pages/DemoEntry.tsx`)

Trocar `navigate("/")` por `window.location.assign("/")` (hard reload). Assim o `AuthProvider` remonta com `isDemoMode() === true` e injeta `DEMO_USER` imediatamente. O botão "Sair da demo" no `DemoBanner` deve fazer o mesmo (limpar flag + hard reload para `/auth`).

### 2. Desbloquear BI e recursos pagos no demo (`src/contexts/PlanContext.tsx`)

Quando `isDemoMode()`:
- forçar `plan = "enterprise"`
- `canAccess = () => true`
- pular o fetch de `subscriptions` e `plan_features` (não tem sessão Supabase)

Efeito: todos os `PlanGate` (BI de Finanças, Clientes, Projetos, Marketing, Tarefas, RH) renderizam o conteúdo real, sem cadeado.

### 3. Neutralizar o widget de limite (`src/components/dashboard/UsageLimitWidget.tsx` + `src/hooks/useFreemiumLimit.ts`)

Em demo:
- `useFreemiumLimit` retorna `{ canAdd: true, limitReached: false, isFree: false, ... }`
- `UsageLimitWidget` mostra badge "Modo demonstração — sem limites" no lugar dos `0/20`

### 4. Verificar que os fixtures estão completos

O `demo-fixtures.ts` já cobre:
`clientes` (7), `projetos` (6), `tarefas` (7), `transacoes` (8), `colaboradores` (6), `campanhas` (6), `conteudos` (6), `processos` (6), `contas_bancarias` (3), `agenda` (5), `bulletin` (3), `audit_log` (6), `integrations_pulse` (4).

Ajustes de contagem para dar consistência com o BI:
- Adicionar `receita_atribuida`, `leads_gerados`, `conversoes` nas campanhas (BI de Marketing lê esses campos).
- Adicionar 2–3 `transacoes` extras no mês anterior (para o `deltaPct` de "vs mês passado" no Hero).
- Adicionar em `demoClientes` alguns com `status="inativo"` e `ultima_interacao` antiga (para o KPI "clientes sem contato 30d+" mostrar algo > 0).

### 5. Ativar os BIs no demo (`src/pages/Financas.tsx`, `Clientes.tsx`, `Projetos.tsx`, `Marketing.tsx`, `Tarefas.tsx`, `RH.tsx`)

Nada a mudar na página em si — o passo 2 já libera. Apenas conferir que os componentes `*BIPanel.tsx` consomem os mesmos hooks (já consomem), portanto os fixtures alimentam os gráficos automaticamente.

## Fora de escopo

- Não mudar schema, RLS, edge functions, Asaas/Stripe.
- Não persistir nada no banco — demo continua 100% em memória.
- Não mudar a landing.

## Detalhes técnicos

- `PlanContext` precisa importar `isDemoMode` de `@/lib/demo-fixtures` e curto-circuitar no `useEffect` inicial.
- Como `isDemoMode()` lê `sessionStorage` de forma síncrona, o hard-reload do passo 1 garante que todos os providers (`AuthProvider`, `PlanProvider`) inicializem com o valor correto sem depender de effects.
- `useFreemiumLimit` é um hook puro que já lê `usePlan()` — se o passo 2 forçar `plan="enterprise"` no demo, `isFree` já vira `false` e o `canAdd` fica sempre `true`. Ainda assim mudamos o widget para dizer explicitamente "Modo demonstração" ao invés de "Plano Enterprise", para não confundir o avaliador.
