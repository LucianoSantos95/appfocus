---
name: AI-Powered Onboarding 10/10
description: Onboarding guiado por IA com personalização por segmento, tool calling, gamificação e cupom de conversão
type: feature
---

## Arquitetura do Onboarding 10/10

### Tabela: `onboarding_sessions`
- user_id (unique), segment, priority_pain, current_step, completed_modules (JSON), achievements (JSON)
- coupon_shown, coupon_code, coupon_expires_at, started_at, completed_at
- RLS por user_id (select, insert, update)

### Edge Function: `onboarding-assistant`
- Usa Lovable AI (google/gemini-3-flash-preview) com streaming SSE
- System prompt personalizado por segmento e etapa
- Tool calling: create_record, complete_module, show_insight
- Roteiros por segmento: Agência (Projetos→Clientes→Finanças), Consultoria (Clientes→Processos→Finanças), Freelancer (Tarefas→Finanças→Clientes), PME (Finanças→RH→Marketing)

### Cupom Stripe
- Código: NpOu4Cxn (ONBOARDING20), 20% off, duração "once"
- Aplicado automaticamente via `create-checkout` (parâmetro `couponId`)
- Banner com countdown de 48h após completar onboarding

### Componentes Frontend
- `OnboardingWelcomeModal` — Coleta segmento + dor principal
- `OnboardingProgressBar` — Barra visual + conquistas
- `OnboardingChat` — Chat streaming com Assistente Focus
- `OnboardingCouponBanner` — Banner fixo com countdown
- `OnboardingFlow` — Container principal (página /onboarding)

### Fluxo
1. Primeiro login → redirect automático para /onboarding
2. WelcomeModal → cria sessão com segmento
3. Chat IA guia 3 módulos → cada módulo cria dados reais
4. Ao completar → confetti + cupom 20% OFF (48h)
5. Banner persiste no dashboard até expirar ou assinar

### Conquistas
- first_step, financial_manager, networker, operation_running
