/**
 * Campanhas promocionais sazonais.
 * Quando a janela da campanha expira, o sistema volta automaticamente
 * ao cupom padrão (fallback) sem necessidade de deploy.
 */

export interface CampaignCoupon {
  code: string;
  stripeId: string;
  percentOff: number;
  durationMonths: number;
  /** Texto curto para exibir ao usuário, ex: "20% OFF nos 3 primeiros meses" */
  label: string;
  /** Texto longo para banners e cards de upgrade */
  longLabel: string;
}

export const WORLD_CUP_CAMPAIGN = {
  /** Início: já em curso */
  startsAt: new Date("2026-06-11T00:00:00-03:00"),
  /** Fim: final da Copa do Mundo 2026 */
  endsAt: new Date("2026-07-19T23:59:59-03:00"),
  coupon: {
    code: "HEXA",
    stripeId: "oJlQUSW6",
    percentOff: 20,
    durationMonths: 3,
    label: "20% OFF nos 3 primeiros meses",
    longLabel: "Cupom HEXA — 20% OFF nos 3 primeiros meses, em comemoração à Copa do Mundo",
  } as CampaignCoupon,
  fallback: {
    code: "FOCUS20",
    stripeId: "NpOu4Cxn",
    percentOff: 20,
    durationMonths: 1,
    label: "20% OFF no primeiro mês",
    longLabel: "Cupom FOCUS20 — 20% OFF no primeiro mês",
  } as CampaignCoupon,
} as const;

export function isWorldCupActive(now: number = Date.now()): boolean {
  return (
    now >= WORLD_CUP_CAMPAIGN.startsAt.getTime() &&
    now <= WORLD_CUP_CAMPAIGN.endsAt.getTime()
  );
}

export function getActiveCampaignCoupon(now: number = Date.now()): CampaignCoupon {
  return isWorldCupActive(now)
    ? WORLD_CUP_CAMPAIGN.coupon
    : WORLD_CUP_CAMPAIGN.fallback;
}

export function getWorldCupTimeLeft(now: number = Date.now()): string | null {
  if (!isWorldCupActive(now)) return null;
  const diff = WORLD_CUP_CAMPAIGN.endsAt.getTime() - now;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}
