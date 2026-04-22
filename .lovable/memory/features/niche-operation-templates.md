---
name: Niche Operation Templates
description: Templates de operação por nicho (Agência, Consultoria, Freelancer, PME) aplicados após a escolha do segmento no onboarding
type: feature
---

## Fase 2 do roadmap TTV — implementada

### Arquivo: `src/lib/niche-templates.ts`
Define 4 templates (`agencia`, `consultoria`, `freelancer`, `pme`), cada um com:
- **pipeline**: 5 processos sequenciais (etapas do funil de operação)
- **tasks**: 4 tarefas-chave priorizadas (com due_date escalonado +2/+3/+4/+5 dias)
- **categories**: listas de categorias de receita e despesa para padronizar lançamentos

### Hook: `useNicheTemplate`
- `apply(segment)` — idempotente (flag em localStorage + dedupe por nome no DB)
- Cria registros reais nas tabelas `processos`, `tarefas` e `bulletin_notes`
- Categorias financeiras viram um **bulletin note fixado** (referência rápida) em vez de schema novo
- Skip seguro para nomes/títulos já existentes (não duplica em cima dos dados demo do trigger `populate_demo_data`)

### Integração: `OnboardingFlow.handleWelcomeComplete`
- Após `createSession` + `recordMilestone('onboarding_started')`, chama `applyNicheTemplate(segment)`
- Toast de feedback informa contagem real de itens criados (ex.: "5 etapas de pipeline, 4 tarefas-chave")

### Decisão de design
- **Não** adicionar coluna `metadata` em `transacoes` para categorias — usar bulletin note evita migration e mantém visibilidade no dashboard
- Template é aplicado **uma única vez** por (user, segment); trocar de segmento aplicaria o novo conjunto sem duplicar
