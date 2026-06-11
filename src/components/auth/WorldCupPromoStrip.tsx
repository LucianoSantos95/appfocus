import { Trophy, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWorldCupActive, getActiveCampaignCoupon } from "@/lib/campaigns";

interface WorldCupPromoStripProps {
  onCadastrar: () => void;
}

/**
 * Faixa promocional fina no topo da landing/Auth.
 * Aparece apenas durante a campanha da Copa do Mundo.
 */
export function WorldCupPromoStrip({ onCadastrar }: WorldCupPromoStripProps) {
  if (!isWorldCupActive()) return null;
  const coupon = getActiveCampaignCoupon();

  return (
    <div
      className="group relative z-20 w-full border-b animate-fade-in transition-all duration-500"
      style={{
        background:
          "linear-gradient(90deg, rgba(0,156,59,0.28) 0%, rgba(255,223,0,0.22) 50%, rgba(0,39,118,0.32) 100%)",
        borderColor: "rgba(255,223,0,0.45)",
      }}
      role="region"
      aria-label="Promoção Copa do Mundo"
    >
      {/* Shine sweep on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "wc-shine 2.5s linear infinite",
        }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-2.5 text-center md:justify-between md:text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="rounded-full p-1.5 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
            style={{ background: "linear-gradient(135deg, #FFDF00, #FFB300)" }}
          >
            <Trophy className="h-3.5 w-3.5" style={{ color: "#002776" }} />
          </div>
          <p className="text-sm font-medium text-foreground/90 transition-colors duration-300 group-hover:text-foreground">
            <span className="font-extrabold" style={{ color: "#FFDF00" }}>
              Rumo ao Hexa 🏆
            </span>{" "}
            — Cadastre-se e ganhe{" "}
            <span className="font-bold text-foreground">{coupon.label}</span> com o cupom{" "}
            <code
              className="inline-block rounded px-1.5 py-0.5 font-mono text-xs tracking-widest transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_10px_rgba(255,223,0,0.6)] group-hover:bg-[rgba(255,223,0,0.35)]"
              style={{
                background: "rgba(255,223,0,0.18)",
                color: "#FFDF00",
                border: "1px solid rgba(255,223,0,0.45)",
              }}
            >
              {coupon.code}
            </code>
          </p>
        </div>
        <Button
          size="sm"
          onClick={onCadastrar}
          className="shrink-0 gap-1.5 font-semibold transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(0,156,59,0.45)]"
          style={{
            background: "linear-gradient(135deg, #009C3B 0%, #00753B 100%)",
            color: "#FFFFFF",
          }}
        >
          <Gift className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
          Aproveitar agora
        </Button>
      </div>
    </div>
  );
}

export default WorldCupPromoStrip;
