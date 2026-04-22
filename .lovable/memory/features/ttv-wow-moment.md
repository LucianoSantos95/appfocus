---
name: TTV WOW Moment
description: Sistema de Time To Value com tabela user_milestones, hook useMilestones e WowMomentCard com vitória quantificada por módulo
type: feature
---

## Fase 1 do roadmap TTV — implementada

### Tabela: `user_milestones`
- Colunas: user_id, milestone_key (texto), metadata (jsonb), reached_at
- UNIQUE (user_id, milestone_key) — cada marco só uma vez por usuário
- RLS: usuário vê os próprios; admin vê todos para análise agregada

### Marcos rastreados (`MilestoneKey`)
- `signup` — primeira sessão autenticada no fluxo de onboarding
- `onboarding_started` — após WelcomeModal (segmento + dor)
- `first_real_data` — primeiro dado real criado via tool call da IA
- `aha_moment` — primeiro módulo concluído (alias do above para análise)
- `first_module_complete` — qualquer módulo concluído
- `onboarding_complete` — 3 módulos completados

### Hook `useMilestones`
- `recordMilestone(key, metadata)` — idempotente
- `getMilestone(key)` / `timeBetween(from, to)` — em segundos
- `formatDuration(s)` — "3 min", "2h 15min"

### Componente `WowMomentCard`
- Card flutuante bottom-right com confetti, headline, métrica grande e subline
- Frases personalizadas por módulo (financas, clientes, projetos, tarefas, rh, marketing) via `buildWowMoment(module, ttv, metadata)`
- Auto-dismiss em 9s
- Mostra "em apenas X min" quando TTV < 10min

### Integração `OnboardingFlow`
- Registra `signup` ao montar, `onboarding_started` no welcome, marcos por módulo no `handleModuleComplete`
- Card de conclusão exibe pill com "Você levou apenas X min para configurar seu Hub"
- `OnboardingChat.onModuleComplete` agora aceita metadata (data do tool call) repassada ao WowMoment
