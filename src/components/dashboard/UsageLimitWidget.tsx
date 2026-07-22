import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { useClientes } from "@/hooks/useClientes";
import { useProjetos } from "@/hooks/useProjetos";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useTarefas } from "@/hooks/useTarefas";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useCampanhas } from "@/hooks/useCampanhas";
import { useProcessos } from "@/hooks/useProcessos";
import { isDemoMode } from "@/lib/demo-fixtures";
import { Sparkles } from "lucide-react";


const FREE_LIMIT = 20;

function barColor(pct: number) {
  if (pct >= 80) return "bg-destructive";
  if (pct >= 60) return "bg-warning";
  return "bg-emerald-500";
}

function labelColor(pct: number) {
  if (pct >= 80) return "text-destructive";
  if (pct >= 60) return "text-warning";
  return "text-foreground";
}

export function UsageLimitWidget() {
  const { plan } = usePlan();
  const { isAdmin } = useTeamPermissions();
  const navigate = useNavigate();

  const { clientes } = useClientes();
  const { projetos } = useProjetos();
  const { colaboradores } = useColaboradores();
  const { tarefas } = useTarefas();
  const { transacoes } = useTransacoes();
  const { campanhas } = useCampanhas();
  const { processos } = useProcessos();

  if (plan !== "gratuito" || isAdmin) return null;

  const modules = [
    { name: "Clientes",      count: clientes.length },
    { name: "Projetos",      count: projetos.length },
    { name: "Colaboradores", count: colaboradores.length },
    { name: "Atividades",    count: tarefas.length },
    { name: "Finanças",      count: transacoes.length },
    { name: "Marketing",     count: campanhas.length },
    { name: "Processos",     count: processos.length },
  ];

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => navigate("/planos")}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Uso do seu plano</h3>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          Gratuito
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {modules.map(({ name, count }) => {
          const pct = Math.min(Math.round((count / FREE_LIMIT) * 100), 100);
          return (
            <div key={name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">{name}</span>
                <span className={cn("font-medium tabular-nums", labelColor(pct))}>
                  {count}/{FREE_LIMIT}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", barColor(pct))}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Clique para ver os planos e aumentar os limites →
      </p>
    </div>
  );
}
