import { useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useProjetos } from "@/hooks/useProjetos";
import { useTarefas } from "@/hooks/useTarefas";
import { useClientes } from "@/hooks/useClientes";
import { DollarSign, AlertCircle, Clock, UserCheck } from "lucide-react";

export function HealthSummary() {
  const { transacoes } = useTransacoes();
  const { projetos } = useProjetos();
  const { tarefas } = useTarefas();
  const { clientes } = useClientes();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const receitaMes = useMemo(
    () =>
      (transacoes || [])
        .filter((t) => t.type === "receita" && t.date && t.date >= monthStart)
        .reduce((s, t) => s + Number(t.value), 0),
    [transacoes, monthStart]
  );

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

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date(now.getTime() - 30 * 86400000);
    return d.toISOString().split("T")[0];
  }, []);

  const clientesInativos = useMemo(
    () =>
      (clientes || []).filter(
        (c) =>
          c.status === "ativo" &&
          (!c.ultima_interacao || c.ultima_interacao < thirtyDaysAgo)
      ).length,
    [clientes, thirtyDaysAgo]
  );

  const sevenDaysFromNow = useMemo(() => {
    const d = new Date(now.getTime() + 7 * 86400000);
    return d.toISOString().split("T")[0];
  }, []);

  const projetosVencemSemana = useMemo(
    () =>
      (projetos || []).filter(
        (p) =>
          p.end_date &&
          p.end_date >= todayStr &&
          p.end_date <= sevenDaysFromNow &&
          p.status !== "concluido" &&
          p.status !== "cancelado"
      ).length,
    [projetos, todayStr, sevenDaysFromNow]
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Receita do Mês"
          value={`R$ ${receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Tarefas Vencidas"
          value={String(tarefasVencidas)}
          icon={AlertCircle}
          variant="destructive"
        />
        <StatCard
          title="Projetos Atrasados"
          value={String(projetosAtrasados)}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Clientes sem Contato"
          value={String(clientesInativos)}
          description="Há mais de 30 dias"
          icon={UserCheck}
          variant="default"
        />
      </div>

      {(projetosVencemSemana > 0 || tarefasVencidas > 0) && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex flex-wrap gap-4 text-sm">
          {projetosVencemSemana > 0 && (
            <span className="text-warning font-medium">
              ⚠️ {projetosVencemSemana} projeto{projetosVencemSemana > 1 ? "s" : ""} vence{projetosVencemSemana > 1 ? "m" : ""} esta semana
            </span>
          )}
          {tarefasVencidas > 0 && (
            <span className="text-destructive font-medium">
              ⚠️ {tarefasVencidas} tarefa{tarefasVencidas > 1 ? "s" : ""} está{tarefasVencidas > 1 ? "ão" : ""} atrasada{tarefasVencidas > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
