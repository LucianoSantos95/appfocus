// O Hub é 100% gratuito — não há teto de registros nem bloqueio por plano.
// O hook permanece para não quebrar as páginas que já o consomem; ele apenas
// reporta "sem limite". Se um dia voltar o modelo pago, basta reintroduzir o teto aqui.
export function useFreemiumLimit(currentCount: number) {
  return {
    canAdd: true,
    limitReached: false,
    isNearLimit: false,
    currentCount,
    maxCount: Infinity,
    isFree: true,
  };
}
