## Mudanças

**1. Migration (já aprovada e executada)**
- Coluna `user_name text` em `onboarding_sessions`, com backfill via `profiles.display_name`.

**2. Reward visível no chat (`OnboardingChat.tsx`)**
Banner fino logo abaixo do header do assistente, sempre visível durante a conversa:
- 0 completos → "Faltam 3 etapas para destravar 20% OFF 🎁"
- 1 completo → "Faltam 2 etapas para destravar 20% OFF 🎁"
- 2 completos → "Falta só 1 etapa para destravar 20% OFF 🔥"
- 3 completos → some

**3. Reward card na barra de progresso (`OnboardingProgressBar.tsx`)**
Card destacado abaixo da barra:
- Em andamento: gift icon + "Faltam X para destravar **20% OFF no 1º mês**" + mini steps `●●○`
- Concluído: check + "Cupom FOCUS20 destravado!"

**4. Captura do nome (`useOnboardingSession.ts` + `OnboardingFlow.tsx`)**
- Interface `OnboardingSession` ganha `user_name: string | null`.
- `createSession(segment, pain, userName?)` grava `user_name` no insert.
- `OnboardingFlow.handleWelcomeComplete` busca `profiles.display_name` (fallback `user.email`) e passa para `createSession`.

Sem mudanças em business logic, edge functions ou outras telas.