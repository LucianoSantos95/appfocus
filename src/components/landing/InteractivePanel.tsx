import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

type PanelState = {
  month: string;
  receita: number;
  despesa: number;
  saldo: number;
  delta: number; // positive or negative percent
  insight: string;
  series: number[]; // 6 points for the sparkline
};

const STATES: PanelState[] = [
  {
    month: "Julho",
    receita: 48200,
    despesa: 21740,
    saldo: 26460,
    delta: 12,
    insight:
      "Julho fechou 12% acima de junho. Maior cliente (Mar Azul) = 28% da receita — vale um follow-up.",
    series: [32, 34, 30, 36, 42, 48],
  },
  {
    month: "Agosto",
    receita: 53900,
    despesa: 24100,
    saldo: 29800,
    delta: 18,
    insight:
      "Agosto bateu recorde: 3 novos contratos fechados nesta semana.",
    series: [34, 40, 44, 46, 50, 54],
  },
  {
    month: "Setembro",
    receita: 41300,
    despesa: 22900,
    saldo: 18400,
    delta: -8,
    insight:
      "Setembro caiu 8%. 2 clientes com pagamento atrasado — sugira cobrança hoje.",
    series: [54, 50, 46, 44, 42, 41],
  },
  {
    month: "Outubro",
    receita: 57600,
    despesa: 25400,
    saldo: 32200,
    delta: 24,
    insight:
      "Outubro +24%: retomada de 2 clientes recuperados.",
    series: [41, 44, 48, 52, 55, 58],
  },
];

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function buildPath(series: number[], w: number, h: number) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const step = w / (series.length - 1);
  return series
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function InteractivePanel() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const state = STATES[idx];

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % STATES.length), 3400);
    return () => clearInterval(id);
  }, []);

  const W = 320;
  const H = 90;
  const path = useMemo(() => buildPath(state.series, W, H), [state]);
  const lastPoint = useMemo(() => {
    const max = Math.max(...state.series);
    const min = Math.min(...state.series);
    const range = Math.max(1, max - min);
    const step = W / (state.series.length - 1);
    const x = (state.series.length - 1) * step;
    const y = H - ((state.series[state.series.length - 1] - min) / range) * H;
    return { x, y };
  }, [state]);

  const up = state.delta >= 0;

  return (
    <div className="relative">
      {/* soft glow behind card */}
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-accent/10 via-primary/5 to-transparent blur-2xl" />

      <div className="relative rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Painel · Fluxo de caixa
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={state.month}
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-medium text-foreground"
            >
              {state.month} · 2026
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Metrics */}
        <div className="px-5 pt-5 grid grid-cols-3 gap-4">
          {[
            { label: "Receita", value: state.receita },
            { label: "Despesa", value: state.despesa },
            { label: "Saldo", value: state.saldo },
          ].map((m) => (
            <div key={m.label}>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {m.label}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${state.month}-${m.label}`}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 font-mono text-[15px] font-semibold text-foreground tabular-nums"
                >
                  {formatBRL(m.value)}
                </motion.p>
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Delta */}
        <div className="px-5 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`d-${state.month}`}
              initial={reduce ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: 4 }}
              transition={{ duration: 0.25 }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold font-mono ${
                up
                  ? "bg-accent/10 text-accent"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {up ? "+" : ""}
              {state.delta}% vs mês anterior
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sparkline */}
        <div className="px-5 pt-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[90px]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={up ? "hsl(var(--accent))" : "hsl(var(--destructive))"} stopOpacity="0.25" />
                <stop offset="100%" stopColor={up ? "hsl(var(--accent))" : "hsl(var(--destructive))"} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <motion.path
              key={`area-${state.month}`}
              d={`${path} L${W},${H} L0,${H} Z`}
              fill="url(#lineGrad)"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Line */}
            <motion.path
              key={`line-${state.month}`}
              d={path}
              fill="none"
              stroke={up ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
            />
            {/* Last point */}
            <motion.circle
              key={`pt-${state.month}`}
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={4}
              fill={up ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            />
          </svg>
        </div>

        {/* Insight */}
        <div className="mx-5 mt-2 mb-5 rounded-xl border border-border/60 bg-background-secondary/50 p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
            <div className="flex-1 min-h-[42px]">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent font-semibold">
                Insight da IA
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`ins-${state.month}`}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 text-xs leading-relaxed text-foreground"
                >
                  {state.insight}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STATES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ver ${STATES[i].month}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-accent" : "w-1.5 bg-border hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
