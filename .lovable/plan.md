

## Assistente de Onboarding Proativo

### O que será feito
Um tooltip/popover discreto que aparece após 10 segundos na dashboard para usuários que ainda não completaram nenhuma tarefa do onboarding, oferecendo ajuda para a primeira ação.

### Comportamento
- **Quem vê**: Apenas usuários autenticados com 0 tarefas concluídas na `onboarding_progress`
- **Quando**: 10 segundos após carregar a dashboard (`/`)
- **Dismissal**: Clicar "Agora não" → salva em `sessionStorage` para não reaparecer na sessão. Clicar "Sim" → navega para `/guia`
- **Não aparece mais**: Quando o usuário tem ≥1 tarefa concluída

### Implementação

**Novo componente**: `src/components/guide/OnboardingPrompt.tsx`
- Popover/card flutuante no canto inferior direito
- Ícone amigável + texto: "Quer ajuda para configurar seu Hub?"
- Dois botões: "Sim, me ajude" (→ `/guia`) e "Agora não" (dismiss)
- Animação de entrada suave (slide-up + fade)
- `setTimeout` de 10s + verificação do `useOnboardingProgress`

**Integração**: Adicionar o componente no `src/pages/Index.tsx` (dashboard)

### Arquivos impactados
- `src/components/guide/OnboardingPrompt.tsx` (novo)
- `src/pages/Index.tsx` (adicionar o componente)

Nenhuma alteração de banco de dados — usa a tabela `onboarding_progress` existente.

