import { motion, useReducedMotion, type MotionStyle, type Transition } from "framer-motion";

// Porte do BorderBeam do MagicUI (apps/www/registry/magicui/border-beam.tsx),
// adaptado: Tailwind v3.4 e cores do nosso token `primary` (sem laranja/roxo).
interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  className?: string;
  borderWidth?: number;
}

export function BorderBeam({
  size = 90,
  duration = 7,
  delay = 0,
  borderWidth = 1.5,
  className,
}: BorderBeamProps) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      style={{ borderWidth }}
    >
      <motion.div
        className={`absolute aspect-square bg-gradient-to-l from-primary via-primary/40 to-transparent ${className ?? ""}`}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          } as MotionStyle
        }
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={
          {
            repeat: Infinity,
            ease: "linear",
            duration,
            delay: -delay,
          } as Transition
        }
      />
    </div>
  );
}
