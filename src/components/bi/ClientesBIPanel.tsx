import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { Users, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Cliente {
  id: string;
  nome: string;
  status: string;
  valor_total: number | null;
  segmento: string | null;
}

interface ClientesBIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
  color: "#ffffff",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
];

export function ClientesBIPanel({ open, onOpenChange, clientes }: ClientesBIPanelProps) {
  // Funnel
  const funnel = useMemo(() => {
    const map: Record<string, number> = {};
    clientes.forEach((c) => {
      const s = c.status || "prospecto";
      map[s] = (map[s] || 0) + 1;
    });
    const order = ["prospecto", "ativo", "inativo"];
    return order
      .filter((s) => map[s])
      .map((s) => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: map[s] }));
  }, [clientes]);

  // Top 10
  const top10 = useMemo(
    () =>
      [...clientes]
        .sort((a, b) => Number(b.valor_total || 0) - Number(a.valor_total || 0))
        .slice(0, 10),
    [clientes]
  );

  // Segment distribution
  const segments = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    clientes.forEach((c) => {
      const seg = c.segmento || "Não definido";
      if (!map[seg]) map[seg] = { count: 0, total: 0 };
      map[seg].count++;
      map[seg].total += Number(c.valor_total || 0);
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, value: v.count, total: v.total }))
      .sort((a, b) => b.value - a.value);
  }, [clientes]);

  // Receita Total somente de clientes ATIVOS
  const totalRevenue = useMemo(
    () => clientes.filter((c) => c.status === "ativo").reduce((s, c) => s + Number(c.valor_total || 0), 0),
    [clientes]
  );
  const activeCount = useMemo(() => clientes.filter((c) => c.status === "ativo").length, [clientes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Análise de Clientes Detalhada</DialogTitle>
        </DialogHeader>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
              <p className="text-lg font-bold text-foreground">{clientes.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clientes Ativos</p>
              <p className="text-lg font-bold text-foreground">{activeCount}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita (Ativos)</p>
              <p className="text-lg font-bold text-foreground">R$ {totalRevenue.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="rounded-xl border border-border p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-4">Funil de Vendas</h4>
          {funnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal vertical={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Clientes" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum cliente encontrado</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 */}
          <div className="rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Top 10 Clientes</h4>
            <div className="space-y-2">
              {top10.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className={cn("text-xs font-bold w-6 text-center", i < 3 ? "text-primary" : "text-muted-foreground")}>
                    #{i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{c.nome}</span>
                  <span className="text-sm font-semibold text-foreground">
                    R$ {Number(c.valor_total || 0).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
              {top10.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente</p>
              )}
            </div>
          </div>

          {/* Segment PieChart */}
          <div className="rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Distribuição por Segmento</h4>
            {segments.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={segments} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {segments.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {segments.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados de segmento</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
