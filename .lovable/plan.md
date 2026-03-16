

## Plano: UI + Limites Freemium

### 1. Ajustes de UI/Identidade

**AuthBrandingPanel.tsx (linha 53 e 78-79)**
- Aumentar logo de `h-24` para `h-32` no desktop e de `h-14` para `h-20` no mobile
- Alterar texto de `+4.000 empresas já utilizam o AppFocus` para `Mais de 100 empresas já utilizam o AppFocus`

### 2. Sistema de Limites Freemium (5 registros por módulo)

**Novo hook: `src/hooks/useFreemiumLimit.ts`**
- Recebe o nome do módulo e a contagem atual de registros
- Consulta o plano atual via `usePlan()`
- Se plano === `gratuito` e contagem >= 5: retorna `{ canAdd: false, limitReached: true, currentCount, maxCount: 5 }`
- Senão: retorna `{ canAdd: true, limitReached: false }`
- Admins sempre podem adicionar

**Novo componente: `src/components/plan/UpgradeModal.tsx`**
- Modal elegante com ícone de bloqueio, título "Limite atingido", mensagem explicativa
- Botão "Fazer Upgrade" redirecionando para `/planos`
- Acionado quando `limitReached === true` e o usuário tenta clicar em "Adicionar"

**Integração em cada página (7 módulos):**

| Página | Hook de dados | Contagem |
|--------|--------------|----------|
| Financas.tsx | useTransacoes | `transacoes.length` |
| RH.tsx | useColaboradores | `colaboradores.length` |
| Marketing.tsx | useCampanhas | `campanhas.length` |
| Projetos.tsx | useProjetos | `projetos.length` |
| Clientes.tsx | useClientes | `clientes.length` |
| Tarefas.tsx | useTarefas | `tarefas.length` |
| Processos.tsx | useProcessos | `processos.length` |

- Em cada página, envolver os botões "Adicionar" com lógica do `useFreemiumLimit`
- Se `limitReached`: desabilitar botão + abrir `UpgradeModal`
- O `PlanGateButton` existente continua controlando ações de plano (export, AI), enquanto o novo limite controla a quantidade de registros no plano gratuito

### Arquivos alterados/criados
- `src/components/auth/AuthBrandingPanel.tsx` — logo + texto
- `src/hooks/useFreemiumLimit.ts` — novo hook
- `src/components/plan/UpgradeModal.tsx` — novo modal
- `src/pages/Financas.tsx` — integrar limite
- `src/pages/RH.tsx` — integrar limite
- `src/pages/Marketing.tsx` — integrar limite
- `src/pages/Projetos.tsx` — integrar limite
- `src/pages/Clientes.tsx` — integrar limite
- `src/pages/Tarefas.tsx` — integrar limite
- `src/pages/Processos.tsx` — integrar limite

