import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";

interface Transacao {
  date: string | null;
  type: string;
  value: number;
  status: string;
}

interface FinanceiroBIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacoes: Transacao[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
};

export function FinanceiroBIPanel({ open, onOpenChange, transacoes }: FinanceiroBIPanelProps) {
  const monthlyData = useMemo(() => {
    const months: Record<string, { receitas: number; despesas: number }> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      months[key] = { receitas: 0, despesas: 0 };
    }

    transacoes.forEach((t) => {
      if (!t.date) return;
      const key = t.date.substring(0, 7);
      if (months[key]) {
        if (t.type === "receita") months[key].receitas += Number(t.value);
        else months[key].despesas += Number(t.value);
      }
    });

    return Object.entries(months).map(([key, v]) => {
      const [y, m] = key.split("-");
      const d = new Date(Number(y), Number(m) - 1);
      return {
        month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receitas: v.receitas,
        despesas: v.despesas,
        lucro: v.receitas - v.despesas,
        margem: v.receitas > 0 ? Math.round(((v.receitas - v.despesas) / v.receitas) * 100) : 0,
      };
    });
  }, [transacoes]);

  const projection = useMemo(() => {
    const last6 = monthlyData.slice(-6);
    const avgRec = last6.reduce((s, m) => s + m.receitas, 0) / Math.max(last6.length, 1);
    const avgDesp = last6.reduce((s, m) => s + m.despesas, 0) / Math.max(last6.length, 1);
    const now = new Date();
    const result = monthlyData.map((m) => ({ ...m, recProj: undefined as number | undefined, despProj: undefined as number | undefined }));
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push({
        month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receitas: 0,
        despesas: 0,
        lucro: 0,
        margem: 0,
        recProj: Math.round(avgRec),
        despProj: Math.round(avgDesp),
      });
    }
    return result;
  }, [monthlyData]);

  const totals = useMemo(() => {
    const rec = monthlyData.reduce((s, m) => s + m.receitas, 0);
    const desp = monthlyData.reduce((s, m) => s + m.despesas, 0);
    return { rec, desp, lucro: rec - desp, margem: rec > 0 ? Math.round(((rec - desp) / rec) * 100) : 0 };
  }, [monthlyData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Análise Financeira Detalhada</DialogTitle>
        </DialogHeader>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita Total (12m)</p>
              <p className="text-lg font-bold text-foreground">R$ {totals.rec.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas Totais (12m)</p>
              <p className="text-lg font-bold text-foreground">R$ {totals.desp.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem de Lucro</p>
              <p className="text-lg font-bold text-foreground">{totals.margem}%</p>
            </div>
          </div>
        </div>

        {/* Lucratividade */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-4">Margem de Lucro Mensal (%)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradMargemBI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Margem"]} />
              <Area type="monotone" dataKey="margem" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gradMargemBI)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fluxo de Caixa Futuro */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-1">Fluxo de Caixa — Projeção</h4>
          <p className="text-xs text-muted-foreground mb-4">Últimos 12 meses + 3 meses projetados (linha pontilhada)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={projection}>
              <defs>
                <linearGradient id="gradRecBI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradDespBI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
              <Legend wrapperStyle={{ paddingTop: "12px" }} />
              <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#gradRecBI)" name="Receitas" />
              <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#gradDespBI)" name="Despesas" />
              <Area type="monotone" dataKey="recProj" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="6 4" fill="none" name="Receita (projeção)" connectNulls={false} />
              <Area type="monotone" dataKey="despProj" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="6 4" fill="none" name="Despesa (projeção)" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Despesas vs Receitas Detalhado */}
        <div className="rounded-xl border border-border p-5">
          <h4 className="font-semibold text-foreground mb-4">Receitas vs Despesas — Mensal</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]} />
              <Legend wrapperStyle={{ paddingTop: "12px" }} />
              <Bar dataKey="receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
