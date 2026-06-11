import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Gift, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isWorldCupActive,
  getActiveCampaignCoupon,
  getWorldCupTimeLeft,
} from "@/lib/campaigns";


export function WorldCupBanner() {
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isWorldCupActive()) return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!isWorldCupActive()) return null;

  const coupon = getActiveCampaignCoupon();
  const timeLeft = getWorldCupTimeLeft();

  return (
    <>
      <section
        data-wc-banner
        className="relative overflow-hidden rounded-2xl border shadow-lg animate-fade-in"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,156,59,0.22) 0%, rgba(255,223,0,0.16) 50%, rgba(0,39,118,0.28) 100%)",
          borderColor: "rgba(255,223,0,0.45)",
        }}
        aria-label="Promoção Copa do Mundo"
      >


        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5 px-6 py-7 pt-10 md:px-10">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="rounded-full p-3 shrink-0 shadow-md"
              style={{ background: "linear-gradient(135deg, #FFDF00, #FFB300)" }}
            >
              <Trophy className="h-7 w-7" style={{ color: "#002776" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">
                Copa do Mundo 2026
              </p>
              <h2
                className="text-3xl md:text-4xl font-extrabold leading-tight"
                style={{
                  background:
                    "linear-gradient(90deg, #009C3B 0%, #FFDF00 50%, #FFFFFF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "0 1px 0 rgba(0,0,0,0.25)",
                }}
              >
                Rumo ao Hexa 🏆
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "rgba(255,223,0,0.20)",
                    border: "1px solid rgba(255,223,0,0.45)",
                    color: "#FFDF00",
                  }}
                >
                  <Gift className="h-3.5 w-3.5" />
                  Cupom <code className="font-mono tracking-widest">{coupon.code}</code> — {coupon.label}
                </span>
                {timeLeft && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-background/40 border border-border/60 px-3 py-1 text-xs text-foreground/80">
                    <Clock className="h-3.5 w-3.5" />
                    Termina em {timeLeft}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/planos")}
            className="shrink-0 gap-2 font-semibold shadow-md"
            style={{
              background: "linear-gradient(135deg, #009C3B 0%, #00753B 100%)",
              color: "#FFFFFF",
            }}
          >
            <Trophy className="h-4 w-4" />
            Aproveitar promoção
          </Button>
        </div>
      </section>
    </>
  );
}
