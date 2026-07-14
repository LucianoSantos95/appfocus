import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { ListTodo, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { SendReportButton } from "@/components/relatorios/SendReportButton";
import { buildTarefasPayload } from "@/components/relatorios/genericPayloads";

interface Tarefa {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  category: string | null;
  due_date: string | null;
  completed_at: string | null;
}

interface TarefasBIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefas: Tarefa[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 8px 32px -4px hsl(var(--primary)/0.15)",
  color: "hsl(var(--popover-foreground))",
};

const STATUS_COLORS = ["hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--success))"];
const statusLabels: Record<string, string> = { pendente: "Pendente", em_andamento: "Em Andamento", concluida: "Concluída" };

export function TarefasBIPanel({ open, onOpenChange, tarefas }: TarefasBIPanelProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const total = tarefas.length;
  const pendentes = useMemo(() => tarefas.filter(t => t.status === "pendente").length, [tarefas]);
  const emAndamento = useMemo(() => tarefas.filter(t => t.status === "em_andamento").length, [tarefas]);
  const concluidas = useMemo(() => tarefas.filter(t => t.status === "concluida").length, [tarefas]);
  const vencidas = useMemo(() => tarefas.filter(t => t.due_date && t.due_date < todayStr && t.status !== "concluida").length, [tarefas, todayStr]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    tarefas.forEach(t => { map[t.status] = (map[t.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: statusLabels[name] || name, value }));
  }, [tarefas]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    tarefas.forEach(t => { const cat = t.category || "Sem categoria"; map[cat] = (map[cat] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [tarefas]);

  // Taxa de conclusão no prazo: compara completed_at vs due_date
  const taxaConclusao = useMemo(() => {
    const concluidasComPrazo = tarefas.filter(t => t.status === "concluida" && t.due_date);
    if (concluidasComPrazo.length === 0) return 0;
    const noPrazo = concluidasComPrazo.filter(t => {
      if (!t.completed_at) return false;
      return t.completed_at.split("T")[0] <= t.due_date!;
    }).length;
    return Math.round((noPrazo / concluidasComPrazo.length) * 100);
  }, [tarefas]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between gap-3">
            <span>Análise de Tarefas</span>
            <SendReportButton payload={buildTarefasPayload(tarefas)} label="Enviar por e-mail" />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <ListTodo className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-display text-2xl font-bold text-foreground tracking-tight tabular-nums">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-warning">{pendentes + emAndamento}</p>
            <p className="text-xs text-muted-foreground">Em Aberto</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-success">{concluidas}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <AlertCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold text-destructive">{vencidas}</p>
            <p className="text-xs text-muted-foreground">Vencidas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
            <h4 className="font-semibold text-foreground mb-4">Tarefas por Categoria</h4>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border)/0.5)" horizontal vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Tarefas" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h4 className="font-semibold text-foreground mb-2">Taxa de Conclusão no Prazo</h4>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-primary">{taxaConclusao}%</p>
            <p className="text-sm text-muted-foreground mt-1">das tarefas concluídas foram entregues no prazo</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
