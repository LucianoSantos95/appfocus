import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Projeto {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  priority: string | null;
}

interface ProjetosBIPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetos: Projeto[];
}

const statusProgress: Record<string, number> = {
  planejamento: 10,
  em_andamento: 50,
  revisao: 80,
  concluido: 100,
  cancelado: 0,
};

const statusColors: Record<string, string> = {
  planejamento: "text-primary",
  em_andamento: "text-success",
  revisao: "text-warning",
  concluido: "text-muted-foreground",
  cancelado: "text-destructive",
};

export function ProjetosBIPanel({ open, onOpenChange, projetos }: ProjetosBIPanelProps) {
  const now = new Date();

  const critical = useMemo(
    () =>
      projetos
        .filter((p) => {
          if (!p.end_date || p.status === "concluido" || p.status === "cancelado") return false;
          const end = new Date(p.end_date);
          const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diff < 7; // within 7 days or overdue
        })
        .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime()),
    [projetos]
  );

  const totalBudget = useMemo(() => projetos.reduce((s, p) => s + Number(p.budget || 0), 0), [projetos]);
  const concluded = useMemo(() => projetos.filter((p) => p.status === "concluido").length, [projetos]);
  const active = useMemo(() => projetos.filter((p) => p.status === "em_andamento").length, [projetos]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Análise de Projetos Detalhada</DialogTitle>
        </DialogHeader>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{projetos.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-success">{active}</p>
            <p className="text-xs text-muted-foreground">Em Andamento</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{concluded}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">R$ {(totalBudget / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Orçamento Total</p>
          </div>
        </div>

        {/* Critical Deadlines */}
        {critical.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h4 className="font-semibold text-destructive">Prazos Críticos</h4>
            </div>
            <div className="space-y-2">
              {critical.map((p) => {
                const end = new Date(p.end_date!);
                const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = diff < 0;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.status}</p>
                    </div>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", isOverdue ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                      {isOverdue ? `${Math.abs(diff)}d atrasado` : `${diff}d restantes`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="rounded-xl border border-border p-5">
          <h4 className="font-semibold text-foreground mb-4">Progresso dos Projetos</h4>
          <div className="space-y-3">
            {projetos.map((p) => {
              const progress = statusProgress[p.status] ?? 30;
              return (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <span className={cn("text-xs font-medium", statusColors[p.status] || "text-muted-foreground")}>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {p.budget && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      R$ {Number(p.budget).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              );
            })}
            {projetos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto encontrado</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
