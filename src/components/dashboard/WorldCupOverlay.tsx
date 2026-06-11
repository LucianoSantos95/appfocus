import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { isWorldCupActive } from "@/lib/campaigns";

// Rotas onde a decoração de Copa pode aparecer.
// Em rotas operacionais (Finanças, RH, etc.) o overlay é ocultado
// para não atrapalhar o trabalho do usuário.
const ALLOWED_ROUTES = new Set<string>(["/", "/auth", "/planos"]);

const CONFETTI_COUNT = 28;
const CONFETTI_COLORS = ["#009C3B", "#FFDF00", "#002776", "#FFFFFF"];
const FLAG_COUNT = 32;

/**
 * Overlay global em tela cheia (fixed) com confetes caindo
 * e varal de bandeirinhas no topo. Renderizado uma única vez
 * em App.tsx enquanto a campanha da Copa estiver ativa.
 */
export function WorldCupOverlay() {
  const { pathname } = useLocation();
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }).map((_, i) => ({
        left: `${(i / CONFETTI_COUNT) * 100 + Math.random() * 3}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${7 + Math.random() * 6}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.round(Math.random() * 6),
        rotate: `${Math.random() * 360}deg`,
      })),
    [],
  );

  if (!isWorldCupActive()) return null;
  if (!ALLOWED_ROUTES.has(pathname)) return null;

  const flagPalette = [
    "linear-gradient(180deg, #009C3B 0% 33%, #FFDF00 33% 66%, #002776 66% 100%)",
    "linear-gradient(180deg, #FFDF00 0% 50%, #009C3B 50% 100%)",
    "linear-gradient(180deg, #002776 0% 50%, #FFFFFF 50% 100%)",
    "linear-gradient(180deg, #009C3B 0% 100%)",
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden hidden md:block motion-reduce:hidden"
    >
      {/* Varal de bandeirinhas no topo */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-around px-2">
        {Array.from({ length: FLAG_COUNT }).map((_, i) => (
          <span
            key={`flag-${i}`}
            className="block origin-top"
            style={{
              width: 14,
              height: 18,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: flagPalette[i % flagPalette.length],
              animation: `wc-flag-sway 3s ease-in-out ${i * 0.1}s infinite alternate`,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
            }}
          />
        ))}
      </div>

      {/* Confetes tela cheia */}
      {pieces.map((p, i) => (
        <span
          key={`c-${i}`}
          className="absolute -top-6 rounded-sm opacity-80"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            transform: `rotate(${p.rotate})`,
            animation: `wc-confetti-fall-full ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default WorldCupOverlay;
