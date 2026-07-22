import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, X, Users, DollarSign, FolderKanban, ListTodo,
  Sparkles, ArrowRight, Gift, type LucideIcon,
} from "lucide-react";

// Activation checklist — HubSpot-style: each item is a BUSINESS OUTCOME, not a feature.
// Personalised order by segment, self-detecting completion from real data, reward on 100%.
type StepKey = "clientes" | "transacoes" | "projetos" | "tarefas";

interface StepDef {
  table: string;
  title: string;
  outcome: string;
  path: string;
  icon: LucideIcon;
}

const STEPS: Record<StepKey, StepDef> = {
  clientes:   { table: "clientes",   title: "Cadastre seu primeiro cliente",     outcome: "Comece seu CRM com histórico e insights", path: "/clientes",   icon: Users },
  transacoes: { table: "transacoes", title: "Lance sua primeira movimentação",   outcome: "Veja seu fluxo de caixa na hora",          path: "/financas",   icon: DollarSign },
  projetos:   { table: "projetos",   title: "Crie seu primeiro projeto",         outcome: "Acompanhe prazos e entregas dos clientes", path: "/projetos",   icon: FolderKanban },
  tarefas:    { table: "tarefas",    title: "Adicione sua primeira tarefa",      outcome: "Organize a rotina da operação",            path: "/atividades", icon: ListTodo },
};

// Segment-personalised order — the most relevant first action leads.
const ORDER_BY_SEGMENT: Record<string, StepKey[]> = {
  agencia:     ["clientes", "projetos", "transacoes", "tarefas"],
  consultoria: ["projetos", "clientes", "transacoes", "tarefas"],
  freelancer:  ["transacoes", "clientes", "tarefas", "projetos"],
  pme:         ["transacoes", "clientes", "tarefas", "projetos"],
};
const DEFAULT_ORDER: StepKey[] = ["clientes", "transacoes", "projetos", "tarefas"];

export function SetupGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<Record<StepKey, boolean> | null>(null);
  const [order, setOrder] = useState<StepKey[]>(DEFAULT_ORDER);
  const [dismissed, setDismissed] = useState(false);

  const dismissKey = user ? `hub_setupguide_done_${user.id}` : "";

  const load = useCallback(async () => {
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("segment").eq("user_id", user.id).maybeSingle();
    const seg = (prof?.segment || "").toLowerCase();
    setOrder(ORDER_BY_SEGMENT[seg] ?? DEFAULT_ORDER);

    const keys: StepKey[] = ["clientes", "transacoes", "projetos", "tarefas"];
    const results = await Promise.all(
      keys.map((k) => supabase.from(STEPS[k].table).select("id", { count: "exact", head: true }).eq("user_id", user.id))
    );
    const d = { clientes: false, transacoes: false, projetos: false, tarefas: false } as Record<StepKey, boolean>;
    keys.forEach((k, i) => { d[k] = (results[i].count ?? 0) > 0; });
    setDone(d);
  }, [user]);

  useEffect(() => {
    if (dismissKey && localStorage.getItem(dismissKey) === "1") setDismissed(true);
    load();
  }, [load, dismissKey]);

  if (dismissed || !done) return null;

  const total = order.length;
  const completed = order.filter((k) => done[k]).length;
  const pct = Math.round((completed / total) * 100);
  const allDone = completed === total;

  const dismiss = () => {
    if (dismissKey) localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-premium">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground tracking-tight">
              {allDone ? "Operação configurada! 🎉" : "Coloque sua operação no ar"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {allDone ? "Você preencheu os módulos essenciais." : `${completed} de ${total} passos · leva ~5 minutos`}
            </p>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Dispensar">
          <X className="w-4 h-4" />
        </button>
      </div>

      <Progress value={pct} className="h-2 mb-4" />

      {allDone ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
          <Gift className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Desbloqueie tudo com 20% OFF</p>
            <p className="text-xs text-muted-foreground">Registros ilimitados, exports e IA — cupom aplicado no checkout.</p>
          </div>
          <Button size="sm" onClick={() => navigate("/planos")} className="gap-1 shrink-0">
            Ver planos <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {order.map((k) => {
            const step = STEPS[k];
            const isDone = done[k];
            const Icon = step.icon;
            return (
              <div
                key={k}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isDone ? "border-border/50 bg-muted/20" : "border-border hover:border-primary/40"
                }`}
              >
                {isDone
                  ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {step.title}
                  </p>
                  {!isDone && <p className="text-xs text-muted-foreground">{step.outcome}</p>}
                </div>
                {!isDone && (
                  <Button size="sm" variant="outline" onClick={() => navigate(step.path)} className="gap-1 shrink-0">
                    <Icon className="w-3.5 h-3.5" /> Fazer agora
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
