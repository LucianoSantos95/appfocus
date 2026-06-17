import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Clock, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoData } from "@/contexts/DemoDataContext";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useAuth } from "@/contexts/AuthContext";
import { wipeDemoData } from "@/lib/demo-seed";
import type { DemoModule } from "@/lib/demo-data";
import { getActiveCampaignCoupon } from "@/lib/campaigns";

function useCouponCountdown(expiresAt: string | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const msLeft = new Date(expiresAt).getTime() - Date.now();
      if (msLeft <= 0) { setLabel("Expirado"); return; }
      const h = Math.floor(msLeft / 3_600_000);
      const m = Math.floor((msLeft % 3_600_000) / 60_000);
      setLabel(h > 0 ? `${h}h ${m}m restantes` : `${m}min restantes`);
    };

    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return label;
}

export function DemoCouponBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { demoModule, clearDemo, couponSpotlightActive, dismissCouponSpotlight } = useDemoData();
  const { session, finalizeOnboarding, startExploring } = useOnboardingSession();
  const countdown = useCouponCountdown(session?.coupon_expires_at);

  const handleSubscribe = async () => {
    dismissCouponSpotlight();
    await finalizeOnboarding();
    clearDemo();
    navigate("/planos");
  };

  const handleStartReal = async () => {
    dismissCouponSpotlight();
    if (user && demoModule) {
      await wipeDemoData(demoModule as DemoModule, user.id);
    }
    await startExploring();
    clearDemo();
  };

  return (
    <div className="relative">
      {/* Coupon spotlight tooltip — appears 45s after demo start */}
      {couponSpotlightActive && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-2 w-80 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative rounded-xl border border-primary/30 bg-card shadow-xl shadow-primary/10 p-4">
            <button
              onClick={dismissCouponSpotlight}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/15 p-2 shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Seu cupom está esperando 🎁
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use <span className="font-mono font-bold text-primary">{getActiveCampaignCoupon().code}</span> e
                  assine com {getActiveCampaignCoupon().label} — disponível só durante a demonstração.
                </p>
                <Button size="sm" onClick={handleSubscribe} className="mt-3 h-7 text-xs gap-1.5 w-full">
                  Resgatar desconto agora
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          {/* Triangle pointer */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-l border-t border-primary/30 bg-card" />
        </div>
      )}

      {/* Main banner */}
      <div
        className={`sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b backdrop-blur-sm transition-shadow duration-300 ${
          couponSpotlightActive ? "shadow-lg shadow-primary/20 ring-1 ring-primary/30" : ""
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(79,126,255,0.15), rgba(99,102,241,0.10))",
          borderBottomColor: "rgba(79,126,255,0.25)",
        }}
      >
        <div className="flex items-center gap-3 text-sm text-foreground">
          <Gift className={`h-4 w-4 text-primary shrink-0 ${couponSpotlightActive ? "animate-bounce" : ""}`} />
          <span>
            <span className="hidden sm:inline">Seu cupom de boas-vindas: </span>
            <span className="font-mono font-bold text-primary">{getActiveCampaignCoupon().code}</span>
            <span> — {getActiveCampaignCoupon().label}</span>
          </span>
          {countdown && (
            <span className="flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5">
              <Clock className="h-3 w-3" />
              {countdown}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleStartReal}>
            Começar com meus dados reais
          </Button>
          <div className={`relative ${couponSpotlightActive ? "after:absolute after:inset-0 after:rounded-md after:animate-ping after:bg-primary/30" : ""}`}>
            <Button size="sm" onClick={handleSubscribe} className="gap-1.5 relative">
              Assinar agora com desconto
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
