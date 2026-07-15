import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, Clock, TrendingUp, UserCheck } from "lucide-react";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useProjetos } from "@/hooks/useProjetos";
import { useTarefas } from "@/hooks/useTarefas";
import { useClientes } from "@/hooks/useClientes";
import { useAuth } from "@/contexts/AuthContext";
import { CountUp, FadeIn } from "@/components/motion";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function firstName(user: { user_metadata?: { full_name?: string; name?: string }; email?: string | null } | null) {
  const n = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  return String(n).split(/[ @]/)[0] || "";
}

/**
 * DashboardHero — peça-âncora do Home.
 * Grid assimétrico 60/40:
 *  ┌────────────────────────────┬───────────────────────┐
 *  │ Saudação + hero KPI + spark │ 3 KPIs empilhados     │
 *  └────────────────────────────┴───────────────────────┘
 */
export function DashboardHero() {
  const { user } = useAuth();
  const { transacoes } = useTransacoes();
  const { projetos } = useProjetos();
  const { tarefas } = useTarefas();
  const { clientes } = useClientes();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Receita do mês
  const receitaMes = useMemo(
    () =>
      (transacoes || [])
        .filter((t) => t.type === "receita" && t.date && t.date >= monthStart)
        .reduce((s, t) => s + Number(t.value), 0),
    [transacoes, monthStart]
  );

  // Receita mês anterior (para delta %)
  const receitaMesAnterior = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed; current month
    const prevMonthStart = new Date(y, m - 1, 1).toISOString().split("T")[0];
    const prevMonthEnd = new Date(y, m, 0).toISOString().split("T")[0];
    return (transacoes || [])
      .filter((t) => t.type === "receita" && t.date && t.date >= prevMonthStart && t.date <= prevMonthEnd)
      .reduce((s, t) => s + Number(t.value), 0);
  }, [transacoes]);

  const deltaPct = useMemo(() => {
    if (!receitaMesAnterior) return null;
    return ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100;
  }, [receitaMes, receitaMesAnterior]);

  // Sparkline: receita agregada por dia — últimos 30 dias
  const spark = useMemo(() => {
    const days: { d: string; v: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
      days.push({ d, v: 0 });
    }
    const idx = new Map(days.map((x, i) => [x.d, i]));
    (transacoes || []).forEach((t) => {
      if (t.type !== "receita" || !t.date) return;
      const i = idx.get(t.date);
      if (i !== undefined) days[i].v += Number(t.value);
    });
    return days;
  }, [transacoes]);

  const hasSpark = spark.some((p) => p.v > 0);

  // KPIs secundários
  const tarefasVencidas = useMemo(
    () =>
      (tarefas || []).filter(
        (t) => t.due_date && t.due_date < todayStr && t.status === "pendente"
      ).length,
    [tarefas, todayStr]
  );
  const projetosAtrasados = useMemo(
    () =>
      (projetos || []).filter(
        (p) =>
          p.end_date &&
          p.end_date < todayStr &&
          p.status !== "concluido" &&
          p.status !== "cancelado"
      ).length,
    [projetos, todayStr]
  );
  const thirtyDaysAgo = useMemo(() => new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0], []);
  const clientesInativos = useMemo(
    () =>
      (clientes || []).filter(
        (c) => c.status === "ativo" && (!c.ultima_interacao || c.ultima_interacao < thirtyDaysAgo)
      ).length,
    [clientes, thirtyDaysAgo]
  );

  const name = firstName(user as any);

  return (
    <FadeIn className="hero-glow">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Painel principal — 60% */}
        <div className="lg:col-span-3 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-elegant p-6 lg:p-8 relative overflow-hidden">
          {/* glow decorativo */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)" }}
          />
          <div className="relative">
            <p className="text-sm text-muted-foreground mb-2">
              {greeting()}
              {name ? `, ` : ""}
              {name && <span className="text-foreground/90 font-medium">{name}</span>}
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.02] tracking-tight text-foreground">
              Sua operação, <span className="gradient-text italic">focada</span>.
            </h1>

            <div className="mt-8 flex items-end gap-6 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1">
                  Receita no mês
                </p>
                <div className="font-display text-5xl md:text-6xl text-foreground leading-none">
                  <span className="text-muted-foreground/60 text-3xl mr-1 align-top">R$</span>
                  <CountUp
                    value={receitaMes}
                    duration={900}
                    format={(n) =>
                      n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    }
                  />
                </div>
                {deltaPct !== null && (
                  <p
                    className={`mt-2 text-xs font-medium inline-flex items-center gap-1 ${
                      deltaPct >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    <TrendingUp className={`w-3.5 h-3.5 ${deltaPct < 0 ? "rotate-180" : ""}`} />
                    {deltaPct >= 0 ? "+" : ""}
                    {deltaPct.toFixed(1)}% vs mês passado
                  </p>
                )}
              </div>

              {/* Sparkline */}
              <div className="flex-1 min-w-[180px] h-20">
                {hasSpark ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spark} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        cursor={{ stroke: "hsl(var(--primary) / 0.3)", strokeWidth: 1 }}
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          color: "hsl(var(--popover-foreground))",
                          fontSize: 11,
                          padding: "4px 8px",
                        }}
                        formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                        labelFormatter={(l) => new Date(l as string).toLocaleDateString("pt-BR")}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#sparkFill)"
                        isAnimationActive
                        animationDuration={900}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/70 italic border border-dashed border-border/50 rounded-lg">
                    Sem receita registrada nos últimos 30 dias
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs empilhados — 40% */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-3">
          <MiniKpi
            icon={AlertCircle}
            label="Tarefas vencidas"
            value={tarefasVencidas}
            tone={tarefasVencidas > 0 ? "danger" : "muted"}
          />
          <MiniKpi
            icon={Clock}
            label="Projetos atrasados"
            value={projetosAtrasados}
            tone={projetosAtrasados > 0 ? "warning" : "muted"}
          />
          <MiniKpi
            icon={UserCheck}
            label="Clientes sem contato 30d+"
            value={clientesInativos}
            tone={clientesInativos > 0 ? "primary" : "muted"}
          />
        </div>
      </div>
    </FadeIn>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  tone: "danger" | "warning" | "primary" | "muted";
}) {
  const toneClass = {
    danger: "text-destructive bg-destructive/10 border-destructive/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    muted: "text-muted-foreground bg-muted/40 border-border/60",
  }[tone];

  return (
    <div className="group rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${toneClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="font-display text-3xl leading-none text-foreground mt-1">
          <CountUp value={value} duration={700} />
        </p>
      </div>
    </div>
  );
}
