import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, ArrowRight, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OnboardingSession } from "@/hooks/useOnboardingSession";

interface Props {
  session: OnboardingSession;
}

export function OnboardingCouponBanner({ session }: Props) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const expiresAt = session.coupon_expires_at ? new Date(session.coupon_expires_at) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : true;

  useEffect(() => {
    if (!expiresAt || isExpired) return;
    const tick = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expirado"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [expiresAt, isExpired]);

  if (!session.coupon_shown || isExpired || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500 w-full max-w-lg px-4">
      <Card className="p-4 bg-gradient-to-r from-primary/20 via-card to-primary/10 border-primary/30 shadow-lg relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/20 p-3 shrink-0">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-foreground">20% OFF</span>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                {session.coupon_code || "FOCUS20"}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {timeLeft}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Parabéns! Use o código <span className="font-semibold text-foreground">{session.coupon_code || "FOCUS20"}</span> ou clique em Assinar para aplicar automaticamente.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/planos")} className="gap-1 shrink-0">
            Assinar <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
