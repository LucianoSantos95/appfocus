import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Clock } from "lucide-react";
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
  const { demoModule, clearDemo } = useDemoData();
  const { session, finalizeOnboarding, startExploring } = useOnboardingSession();
  const countdown = useCouponCountdown(session?.coupon_expires_at);

  const handleSubscribe = async () => {
    await finalizeOnboarding();
    clearDemo();
    navigate("/planos");
  };

  const handleStartReal = async () => {
    // Delete only [DEMO]-tagged rows — real data is untouched
    if (user && demoModule) {
      await wipeDemoData(demoModule as DemoModule, user.id);
    }
    // Mark as "exploring" so re-engagement emails keep firing
    await startExploring();
    clearDemo();
  };

  return (
    <div
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b backdrop-blur-sm"
      style={{
        background: "linear-gradient(135deg, rgba(79,126,255,0.15), rgba(99,102,241,0.10))",
        borderBottomColor: "rgba(79,126,255,0.25)",
      }}
    >
      <div className="flex items-center gap-3 text-sm text-foreground">
        <Gift className="h-4 w-4 text-primary shrink-0" />
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
        <Button size="sm" onClick={handleSubscribe} className="gap-1.5">
          Assinar agora com desconto
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
