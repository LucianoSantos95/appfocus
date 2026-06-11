import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { usePlan } from "@/contexts/PlanContext";
import { getActiveCampaignCoupon } from "@/lib/campaigns";

function useCountdown(expiresAt: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { timeLeft, expired };
}

export function PersistentCouponWidget() {
  const navigate = useNavigate();
  const { session, loading } = useOnboardingSession();
  const { plan } = usePlan();
  const { timeLeft, expired } = useCountdown(session?.coupon_expires_at);

  // Not applicable for paying users or while session is loading
  if (loading || plan !== "gratuito") return null;

  // No coupon ever activated for this user
  if (!session?.coupon_shown || !session?.coupon_code || !session?.coupon_expires_at) return null;

  // Coupon window has closed
  if (expired) return null;

  return (
    <div
      className="rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-4 animate-fade-in"
      style={{
        background: "linear-gradient(135deg, rgba(79,126,255,0.10) 0%, rgba(99,102,241,0.06) 100%)",
        borderColor: "rgba(79,126,255,0.40)",
      }}
    >
      {/* Left: icon + coupon info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-full bg-primary/15 p-2.5 shrink-0">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-foreground text-sm">Seu cupom de boas-vindas</span>
            <code className="font-mono font-bold text-primary bg-primary/12 border border-primary/25 px-2 py-0.5 rounded text-sm tracking-widest">
              {session.coupon_code}
            </code>
            <span className="text-sm text-muted-foreground hidden sm:inline">— {getActiveCampaignCoupon().label} aplicado automaticamente</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Expira em:</span>
            <span className="font-mono tabular-nums">{timeLeft}</span>
          </div>
        </div>
      </div>

      {/* Right: CTA */}
      <Button
        onClick={() => navigate("/planos")}
        className="gap-2 shrink-0 bg-primary hover:bg-primary/90"
      >
        <Zap className="h-4 w-4" />
        Assinar com {getActiveCampaignCoupon().percentOff}% OFF
      </Button>
    </div>
  );
}
