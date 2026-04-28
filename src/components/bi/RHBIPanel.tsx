import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { Users, DollarSign, TrendingUp } from "lucide-react";

interface Colaborador {
  id: string;
  name: string;
  department: string | null;
  status: string;
  salary: number | null;
}

interface RHBIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradores: Colaborador[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
  color: "hsl(var(--popover-foreground))",
};

const STATUS_COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--muted-foreground))"];

export function RHBIPanel({ open, onOpenChange, colaboradores }: RHBIPanelProps) {
  const ativos = useMemo(() => colaboradores.filter(c => c.status === "ativo"), [colaboradores]);
  const folha = useMemo(() => ativos.reduce((s, c) => s + Number(c.salary || 0), 0), [ativos]);
  const salarioMedio = ativos.length > 0 ? Math.round(folha / ativos.length) : 0;

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    colaboradores.forEach(c => { map[c.status] = (map[c.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [colaboradores]);

  // Dynamic department data from actual collaborators
  const deptData = useMemo(() => {
    const map: Record<string, number> = {};
    ativos.forEach(c => { const d = c.department || "Sem departamento"; map[d] = (map[d] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [ativos]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Análise de RH</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Headcount Ativo</p>
              <p className="text-lg font-bold text-foreground">{ativos.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Folha Salarial</p>
              <p className="text-lg font-bold text-foreground">R$ {folha.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Salário Médio</p>
              <p className="text-lg font-bold text-foreground">R$ {salarioMedio.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Distribuição por Status</h4>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {statusData.map((_, i) => (<Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </div>

          <div className="rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Colaboradores por Departamento</h4>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Colaboradores" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
