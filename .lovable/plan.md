
# Refatoração do Onboarding — 2 frentes

Escopo enxuto: landing já cobre "ver como fica" via demo pública, então o onboarding do usuário logado passa a mirar em **reduzir atrito** e **converter no momento certo**.

---

## Frente 1 — Reordenar passos e aliviar atrito do WhatsApp
**Problema:** pedir telefone antes de mostrar valor é o maior ponto de abandono. O passo "Contato" está entre "Perfil" e "Módulo", quebrando o momentum.

**O que muda:**
- Novo fluxo: **Perfil → Módulo → (redireciona e seeda) → Momento Wow → Prompt opcional de WhatsApp dentro do WowMomentCard**.
- Remover o step `phone` do `WelcomeChoiceModal`. Reduz de 3 dots para 2 (Perfil / Início).
- Adicionar campo opcional de telefone no `WowMomentCard`, com CTA "Receber alertas no WhatsApp" — só aparece depois do wow (usuário já viu valor).
- Salvar telefone via `profiles.update({ phone })` como já é feito hoje.
- Confirmar nome quando vier truncado de email (ex.: `joao.silva`) — input inline no header do modal, pré-preenchido, editável.

**Arquivos:**
- `src/components/onboarding/WelcomeChoiceModal.tsx` — remover step `phone`, ajustar dots, adicionar input de nome quando derivado de email.
- `src/components/onboarding/OnboardingFlow.tsx` — `onChoose` recebe `phone: null` nessa etapa; wow ganha callback para gravar telefone depois.
- `src/components/onboarding/WowMomentCard.tsx` — bloco opcional de captura de telefone.

---

## Frente 2 — Cupom por gatilho de engajamento
**Problema:** cupom de 20% dispara no primeiro segundo dentro do módulo. Usuário ainda não percebeu valor → cupom vira ruído e desvaloriza a oferta.

**O que muda:**
- No `useOnboardingSession.createSession`, **não** setar `coupon_shown: true` nem `coupon_expires_at` imediatamente.
- Criar `useEngagementCoupon` que observa `user_milestones` (já existe): ao atingir **3 ações reais** (criar/editar cliente, transação ou tarefa não-demo), ativa o cupom via `updateSession({ coupon_shown: true, coupon_expires_at: now+48h })`.
- `OnboardingCouponBanner` continua reagindo a `coupon_shown` — só o momento da ativação muda.
- Corrigir bug conceitual: `priority_pain` hoje recebe `DemoModule`. Passar a receber uma **dor real** via dropdown curto no passo Perfil ("Perder tempo com planilha", "Não sei se dou lucro", "Perco prazo", "Não tenho pipeline"). Alimenta emails/in-app depois.

**Arquivos:**
- `src/hooks/useOnboardingSession.ts` — remover ativação imediata do cupom no `createSession`.
- `src/hooks/useEngagementCoupon.ts` — novo hook.
- `src/components/onboarding/WelcomeChoiceModal.tsx` — trocar `priority_pain` por seletor de dor.
- Montar o hook no `MainLayout` (ou `Index`) para observar milestones em background.

---

## Detalhes técnicos

- Ordem de merge: **F1 → F2**. Independentes, sem conflito de arquivo além do `WelcomeChoiceModal`.
- F2 depende de `user_milestones` — usar `useMilestones` já existente para contagem.
- Aditivo em `onboarding_sessions`: nenhum campo novo obrigatório; comportamento muda só no momento do update.
- Nada muda em Asaas/Stripe, `google-integration`, `user_integrations`, Slack ou nas migrations marcadas como obsoletas.

## Fora do escopo
- Preview de seed e rota "já tenho dados" — desnecessários porque a landing já oferece a demo pública.
- A/B test de copy dos cards.
- Personalização do WowMoment por dor selecionada (próxima iteração).
