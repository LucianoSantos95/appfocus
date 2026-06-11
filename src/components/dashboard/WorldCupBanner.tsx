import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Gift, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isWorldCupActive,
  getActiveCampaignCoupon,
  getWorldCupTimeLeft,
  WORLD_CUP_CAMPAIGN,
} from "@/lib/campaigns";

const CONFETTI_COUNT = 14;
const CONFETTI_COLORS = ["#009C3B", "#FFDF00", "#002776", "#FFFFFF"];

function Confetti() {
  // Pré-calcula propriedades para evitar reflow
  const pieces = Array.from({ length: CONFETTI_COUNT }).map((_, i) => ({
    left: `${(i / CONFETTI_COUNT) * 100 + Math.random() * 6}%`,
    delay: `${Math.random() * 4}s`,
    duration: `${4 + Math.random() * 3}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.round(Math.random() * 5),
    rotate: `${Math.random() * 360}deg`,
  }));
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden hidden md:block"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute -top-4 rounded-sm opacity-80"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            transform: `rotate(${p.rotate})`,
            animation: `wc-confetti-fall ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FlagBunting() {
  const flags = Array.from({ length: 18 });
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-around px-2 pt-0"
    >
      {flags.map((_, i) => {
        const colors = [
          "linear-gradient(180deg, #009C3B 0% 33%, #FFDF00 33% 66%, #002776 66% 100%)",
          "linear-gradient(180deg, #FFDF00 0% 50%, #009C3B 50% 100%)",
          "linear-gradient(180deg, #002776 0% 50%, #FFFFFF 50% 100%)",
          "linear-gradient(180deg, #009C3B 0% 100%)",
        ];
        return (
          <span
            key={i}
            className="block origin-top"
            style={{
              width: 14,
              height: 18,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: colors[i % colors.length],
              animation: `wc-flag-sway 3s ease-in-out ${i * 0.12}s infinite alternate`,
            }}
          />
        );
      })}
    </div>
  );
}

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
      {/* Keyframes inline para não poluir tailwind config */}
      <style>{`
        @keyframes wc-confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 0; }
          10%  { opacity: 0.9; }
          100% { transform: translateY(220px) rotate(540deg); opacity: 0; }
        }
        @keyframes wc-flag-sway {
          from { transform: rotate(-4deg); }
          to   { transform: rotate(4deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-wc-banner] * { animation: none !important; }
        }
      `}</style>

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
        <FlagBunting />
        <Confetti />

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
