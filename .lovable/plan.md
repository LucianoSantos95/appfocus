# Plano: Tema Copa do Mundo + Cupom HEXA (campanha sazonal)

## 1. Decoração visual na Home

Novo componente `WorldCupBanner` no topo de `src/pages/Index.tsx`:
- **Faixa "Rumo ao Hexa"** — banner full-width com gradiente verde/amarelo/azul, tipografia bold, ícone de troféu.
- **Bandeirinhas decorativas** — varal SVG no topo (verde/amarelo/azul/branco) com leve balanço (CSS).
- **Confetes caindo** — efeito sutil (~15 partículas, `@keyframes fall`) sobre o banner. Respeita `prefers-reduced-motion` e desativa em mobile.
- **CTA promocional** — badge "Cupom HEXA — 20% OFF nos 3 primeiros meses" + botão "Ver planos".

Tokens semânticos em `index.css`: `--brazil-green`, `--brazil-yellow`, `--brazil-blue`.

## 2. Aviso de promoção na Home

Card `PromoCopaWidget` abaixo do banner, exibido apenas para usuários no plano gratuito:
- Texto: "🏆 Promoção Copa do Mundo ativa — complete o onboarding e ganhe 20% OFF nos 3 primeiros meses com o cupom HEXA"
- Botão "Completar onboarding" ou "Assinar com HEXA"
- Countdown até o fim da Copa

## 3. Cupom HEXA substitui FOCUS20

### Stripe
- Criar cupom **HEXA**: 20% off, `duration: repeating`, `duration_in_months: 3`.
- Guardar o novo `coupon_id`.
- FOCUS20 permanece no Stripe (apenas inativado no app) para histórico.

### Código
- `src/pages/Planos.tsx`: trocar `ONBOARDING_COUPON_ID`, atualizar textos para "20% OFF nos 3 primeiros meses", ajustar exibição de preço com desconto.
- `DemoCouponBanner.tsx`, `OnboardingCouponBanner.tsx`, `OnboardingCouponPreview.tsx`, `PersistentCouponWidget.tsx`: substituir `FOCUS20` por `HEXA` e atualizar copy.
- Onde o `coupon_code` é gravado em `onboarding_sessions` (provavelmente em `onboarding-assistant` edge function ou `OnboardingFlow`): gravar `HEXA`.
- Emails/templates que mencionam FOCUS20: atualizar.

## 4. Campanha sazonal — expiração automática

A campanha tem **data de início e fim**. Após o fim, o sistema volta automaticamente ao cupom padrão sem precisar de deploy.

### Datas (Copa do Mundo 2026)
- **Início:** 11/06/2026 (já em curso)
- **Fim:** 19/07/2026 23:59 (final da Copa)
- **Padrão pós-campanha:** volta ao cupom **FOCUS20** (20% off, 1 mês) — comportamento atual.

### Implementação
Novo arquivo `src/lib/campaigns.ts` com flag central:
```ts
export const WORLD_CUP_CAMPAIGN = {
  startsAt: new Date("2026-06-11T00:00:00-03:00"),
  endsAt:   new Date("2026-07-19T23:59:59-03:00"),
  coupon: {
    code: "HEXA",
    stripeId: "<novo_id>",
    percentOff: 20,
    durationMonths: 3,
    label: "20% OFF nos 3 primeiros meses",
  },
  fallback: {
    code: "FOCUS20",
    stripeId: "NpOu4Cxn",
    percentOff: 20,
    durationMonths: 1,
    label: "20% OFF no primeiro mês",
  },
};

export function getActiveCampaignCoupon() {
  const now = Date.now();
  return now >= WORLD_CUP_CAMPAIGN.startsAt.getTime() &&
         now <= WORLD_CUP_CAMPAIGN.endsAt.getTime()
    ? WORLD_CUP_CAMPAIGN.coupon
    : WORLD_CUP_CAMPAIGN.fallback;
}

export const isWorldCupActive = () => {
  const now = Date.now();
  return now >= WORLD_CUP_CAMPAIGN.startsAt.getTime() &&
         now <= WORLD_CUP_CAMPAIGN.endsAt.getTime();
};
```

Todos os componentes consomem `getActiveCampaignCoupon()` — depois de 19/07/2026 voltam sozinhos a FOCUS20 e a decoração some.

`WorldCupBanner` e `PromoCopaWidget` só renderizam se `isWorldCupActive()` for true.

### Usuários que já receberam HEXA durante a campanha
- O `coupon_code` gravado no banco permanece válido até o `coupon_expires_at` individual de cada sessão (não muda).
- O `couponId` enviado ao checkout vem de `getActiveCampaignCoupon()`: se o usuário entrar no /planos após o fim, recebe FOCUS20 (1 mês) mesmo que `coupon_code` antigo no banco seja "HEXA". Aceitável e esperado para campanha sazonal.

## Arquivos
- **Novos:** `src/components/dashboard/WorldCupBanner.tsx`, `src/components/dashboard/PromoCopaWidget.tsx`, `src/lib/campaigns.ts`
- **Editados:** `src/pages/Index.tsx`, `src/pages/Planos.tsx`, `DemoCouponBanner.tsx`, `OnboardingCouponBanner.tsx`, `OnboardingCouponPreview.tsx`, `PersistentCouponWidget.tsx`, `index.css`
- **Stripe:** criar cupom HEXA (20%, repeating, 3 meses)
- Sem migrações de banco

## Estratégia (resposta)
Sim — 3 meses de desconto aumenta LTV percebido e a tematização sazonal cria urgência natural. Com expiração automática via `campaigns.ts`, não há risco de a promoção "vazar" para fora da Copa.
