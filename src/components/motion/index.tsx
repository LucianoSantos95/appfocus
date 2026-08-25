import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type HTMLAttributes } from "react";
import { useLocation } from "react-router-dom";

/* ---------------- FadeIn ---------------- */
interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  y?: number;
  children: ReactNode;
}

export function FadeIn({ delay = 0, y = 8, children, className, ...rest }: FadeInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Stagger ---------------- */
const staggerParent: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

interface StaggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: "div" | "ul" | "ol" | "section";
  /** Anima só quando entra na viewport (uma vez). */
  inView?: boolean;
  /** Intervalo entre os filhos, em segundos. */
  gap?: number;
}

export function Stagger({ children, className, as = "div", inView = false, gap, ...rest }: StaggerProps) {
  const reduce = useReducedMotion();
  const Comp: any = (motion as any)[as];
  const parent: Variants = gap
    ? { hidden: { opacity: 1 }, show: { opacity: 1, transition: { staggerChildren: gap, delayChildren: 0.02 } } }
    : staggerParent;
  const anim = inView
    ? { whileInView: "show", viewport: { once: true, margin: "-80px" } }
    : { animate: "show" };
  return (
    <Comp
      variants={reduce ? undefined : parent}
      initial={reduce ? false : "hidden"}
      {...(reduce ? { animate: "show" } : anim)}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

interface StaggerItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: "div" | "li";
}

export function StaggerItem({ children, className, as = "div", ...rest }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const Comp: any = (motion as any)[as];
  return (
    <Comp
      variants={reduce ? undefined : staggerChild}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* ---------------- PageTransition ---------------- */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------- CountUp ---------------- */
interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  format?: (n: number) => string;
}

export function CountUp({
  value,
  duration = 800,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  format,
}: CountUpProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    fromRef.current = display;
    startRef.current = null;
    const target = value;
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + delta * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce]);

  const text = format
    ? format(display)
    : `${prefix}${display.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

  return <span className={className}>{text}</span>;
}
