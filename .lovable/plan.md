## Diagnóstico da lentidão

Rodei uma varredura no código e encontrei três causas principais que explicam a lentidão sentida no login e na navegação entre módulos.

### 1. React Query está instalado mas **nenhum hook o utiliza** (impacto: 🔴 alto)

`App.tsx` cria um `QueryClient` com `staleTime: 5min`, mas `grep useQuery|useMutation` retorna **0 ocorrências**. Todos os hooks (`useTransacoes`, `useClientes`, `useProjetos`, `useColaboradores`, `useTarefas`, `useCampanhas`, `useConteudos`, `useProcessos`, `useContasBancarias`, `useNotifications`, `useMilestones`, etc.) usam `useState + useEffect` e refazem o `SELECT *` do zero **toda vez que um componente monta**.

Consequências observadas nos network logs:
- Ao abrir `/financas`, `transacoes`, `contas_bancarias`, `import_history`, `colaboradores`, `clientes`, `projetos`, `notifications` são chamados; muitos **duas vezes** no mesmo tick porque `Sidebar` + a página + widgets chamam os mesmos hooks.
- Ao trocar de módulo, tudo é refeito, mesmo se os dados foram carregados 5 segundos antes.
- `Index` monta simultaneamente `DashboardHero`, `HealthSummary` e `UsageLimitWidget` — cada um chama `useTransacoes/useProjetos/useTarefas/useClientes` independentemente, gerando ~12 requests redundantes em vez de 4.

### 2. Login sequencial com 2 RPCs antes do `signInWithPassword` (impacto: 🟡 médio)

`AuthContext.signIn` executa em série: `check_login_rate_limit` → `record_login_attempt` → `signInWithPassword`. Os logs mostram o próprio `POST /token` levando ~309–342 ms, e as duas RPCs adicionam mais um roundtrip cada.

### 3. `ProtectedRoute` bloqueia render com checagem MFA + `AuthProvider` sem hidratação otimista (impacto: 🟡 médio)

- `AuthProvider` inicia com `isLoading: true` mesmo quando há sessão em localStorage → tela em branco por alguns frames.
- `ProtectedRoute` mostra spinner de página inteira em qualquer navegação até `mfaRequired !== null`. Existe cache em `sessionStorage`, mas o efeito ainda dispara e o gate de render continua.
- `WorldCupOverlay`, `PageTransition` e vários providers montam no boot inicial — nenhum é crítico para pintar o dashboard.

---

## Plano de correção

### Fase 1 — Refatorar hooks de dados para React Query (maior ganho)
Padronizar todos os hooks para o mesmo shape, mantendo a API pública (`{ data, isLoading, add..., update..., remove... }`) para não quebrar as páginas.

Template:
```ts
export function useTransacoes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ["transacoes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("transacoes").select("*").order("date", { ascending: false });
      if (error) throw error; return data as Transacao[];
    },
    enabled: !!user,
  });
  const addTransacao = useMutation({ /* invalida ["transacoes"] */ }).mutateAsync;
  // ...
}
```

Hooks a migrar (mesma receita, em paralelo):
`useTransacoes`, `useClientes`, `useProjetos`, `useColaboradores`, `useTarefas`, `useCampanhas`, `useCampanhaClientes`, `useConteudos`, `useContasBancarias`, `useProcessos`, `useNotifications`, `useMilestones`, `useImportHistory`, `useOnboardingSession`, `useOnboardingProgress`, `useUserPreferences`, `useWhatsAppPreferences`, `usePlanFeatures`, `useFreemiumLimit`, `useConsentRecords`, `useSubscriberFollowups`.

Ganhos:
- Sidebar + página + widgets = **1 request** por tabela (deduplicado pelo QueryClient).
- Navegar entre módulos passa a servir do cache instantaneamente por 5 min; o refetch acontece em background sem bloquear UI.

### Fase 2 — Otimizar boot de auth
1. Em `AuthContext`, hidratar `session` de forma síncrona chamando `supabase.auth.getSession()` **antes** de setar `isLoading=true` (ou usar `getSession()` com `setIsLoading(false)` imediato se retornar sessão em cache), evitando o flash de loading.
2. Em `signIn`, disparar `check_login_rate_limit` e `record_login_attempt` em **paralelo** com `Promise.all`, e mover `record_login_attempt` para *fire-and-forget* pós-login bem sucedido (não bloqueia o token).
3. Em `ProtectedRoute`, se houver `user` e não houver cache MFA, renderizar as `children` otimisticamente (assumindo `mfaRequired=false`) e revalidar em background. Se descobrir que precisa MFA, aí sim monta o `MfaChallenge`. Elimina o spinner em todas as navegações.

### Fase 3 — Reduzir trabalho no primeiro paint
1. Lazy-load de `WorldCupOverlay` e `PageTransition` (não são críticos para o dashboard).
2. Mover `TeamPermissionsProvider` e `PlanProvider` para dentro do `ProtectedRoute` (não são necessários em `/auth`, `/planos`, `/termos`, etc.).
3. Em `Index`, consolidar `DashboardHero`, `HealthSummary` e `UsageLimitWidget` para receberem dados via props (ou compartilharem via React Query cache já do passo 1) — depois do passo 1 esse ponto praticamente resolve sozinho.
4. Adicionar `<link rel="preconnect">` para o domínio do Supabase em `index.html` para cortar handshake TLS do primeiro request.

### Fase 4 — Índices e payloads (verificação)
1. Rodar `slow_queries` no backend para confirmar que não há query lenta (`transacoes`, `clientes`, `projetos` são candidatas prováveis).
2. Trocar `select("*")` por colunas realmente usadas em telas grandes (Financas, Clientes). Deixar para depois se o gargalo cair na Fase 1.

---

## Detalhes técnicos

- **API pública dos hooks mantida**: manter os nomes atuais (`transacoes`, `addTransacao`, etc.) para não tocar em nenhuma página. Apenas o miolo do hook muda.
- **Query keys por usuário** (`["transacoes", user.id]`) evitam vazamento de cache entre contas quando alguém sai e entra com outra conta.
- **Realtime**: onde já existe assinatura Realtime (verificar), substituir por `qc.invalidateQueries` no callback.
- **Erros de auth**: retenção de `retry: 2` já lida com blips; para queries que falharem por 401 (sessão expirada), configurar `retry: (count, err) => err.status !== 401`.
- **Sem migrações de banco** nesta fase; alterações puramente frontend.

### Ordem de execução sugerida
Fase 1 (bloco único, todos os hooks em paralelo) → Fase 2 → Fase 3 → medir → Fase 4 se ainda necessário.

### Métrica de sucesso
- Requests duplicados no Network cairem para 1 por tabela por navegação.
- Troca entre módulos deve ficar **instantânea** (render do cache) enquanto revalida em background.
- Tempo até dashboard interativo após login: alvo < 800 ms com sessão em cache.
