# Ajustes finais da campanha Copa do Mundo

## 1. Hover sutil na decoração (dentro do hub)

No `WorldCupBanner.tsx` (cartão "Rumo ao Hexa" na Home):
- Adicionar `group` + transição no `<section>`: leve `hover:scale-[1.01]`, `hover:shadow-glow`, e brilho diagonal animado (gradient sweep) ao passar o mouse.
- O troféu ganha `group-hover:animate-bounce` discreto e o ícone do botão um `group-hover:rotate-12`.
- Tudo respeitando `motion-reduce:transition-none`.

## 2. CTA "Aproveitar promoção" inteligente

Atualizar o `onClick` do botão no `WorldCupBanner` e também no `WorldCupPromoStrip` (Auth) e `PersistentCouponWidget`:
- Usar o hook `useOnboardingSession`:
  - Se `isOnboardingComplete` (ou já existe `session?.completed_at`) → `navigate("/planos")`.
  - Caso contrário → `navigate("/onboarding")`.
- Na strip de Auth (usuário deslogado) mantém comportamento atual (abre signup).

## 3. Planos: anual primeiro

Em `src/pages/Planos.tsx`:
- Mudar o estado inicial `useState(false)` → `useState(true)` para o toggle anual.
- Garantir que a seleção visual do toggle reflita corretamente o padrão "Anual".
- Banner do cupom continua igual.

## 4. Confete apenas na Home

Hoje o `WorldCupOverlay` é montado em `App.tsx` e aparece em todas as rotas internas, atrapalhando trabalho em Finanças/RH/etc.

Plano:
- Manter o overlay montado em `App.tsx`, mas dentro do componente verificar `useLocation()`:
  - Renderizar somente quando `pathname === "/"` **ou** quando estiver em `/auth`, `/planos`, `/onboarding` (rotas promocionais/landing).
  - Em rotas operacionais (`/financas`, `/rh`, `/marketing`, `/projetos`, `/clientes`, `/atividades`, `/processos`, `/guia`, `/assinantes`) **não renderizar** confete nem bandeirinhas.
- O `WorldCupBanner` (cartão estático com "Rumo ao Hexa") continua visível na Home.
- A strip de Auth (`WorldCupPromoStrip`) continua na página de login.

## 5. Auditoria do onboarding

Após as mudanças, validar:

1. **OnboardingFlow / OnboardingChat**: confirmar que o overlay agora **não** aparece sobre o chat (rota `/onboarding` — decidir se mantemos overlay ali; recomendação: **manter, mas sem confete pesado**, ou remover para não atrapalhar leitura do chat. Proposta: **remover** `/onboarding` da lista de rotas com overlay para garantir foco).
2. **useOnboardingSession**: `COUPON_CODE` continua sendo lido de `getActiveCampaignCoupon()` — ok, sem regressão.
3. **DemoCouponBanner / OnboardingCouponBanner / OnboardingCouponPreview / OnboardingProgressBar**: confirmar que labels dinâmicos (HEXA / 20% / 3 meses) seguem corretos.
4. **CTA "Aproveitar promoção"**: ao não ter sessão (`needsOnboarding`), deve cair em `/onboarding`. Ao ter `completed_at`, vai para `/planos` com cupom já aplicado.
5. **Planos.tsx**: com `annual = true` por padrão, a lógica de `displayAnnualTotal` e do checkout com `interval = "annual"` continua correta — o `priceId` anual já existe em `STRIPE_PLANS`.
6. **`WelcomeChoiceModal`/`OnboardingWelcomeModal`**: garantir que continuam abrindo normalmente e que o overlay (quando presente em `/`) não bloqueia cliques — já usa `pointer-events-none`, ok.
7. **prefers-reduced-motion**: hover sweep + bounce devem respeitar `motion-reduce:`.

## Arquivos afetados

- `src/components/dashboard/WorldCupBanner.tsx` — hover + CTA inteligente
- `src/components/dashboard/WorldCupOverlay.tsx` — gate por rota via `useLocation`
- `src/components/dashboard/PersistentCouponWidget.tsx` — CTA inteligente
- `src/pages/Planos.tsx` — `annual` default `true`
- `src/index.css` — keyframe `wc-shine` para o hover sweep (opcional)

## Detalhes técnicos

```ts
// WorldCupOverlay.tsx
const { pathname } = useLocation();
const ALLOWED = new Set(["/", "/auth", "/planos"]);
if (!ALLOWED.has(pathname)) return null;
```

```ts
// CTA inteligente
const { session, isOnboardingComplete } = useOnboardingSession();
const target = isOnboardingComplete || session?.completed_at ? "/planos" : "/onboarding";
```

Sem mudanças em edge functions, schema ou Stripe.
