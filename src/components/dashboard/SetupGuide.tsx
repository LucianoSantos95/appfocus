import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { wipeDemoData, markDemoCleared } from "@/lib/demo-seed";
import { CustomizeDialog } from "@/components/customize/CustomizeDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, X, Users, DollarSign, FolderKanban, ListTodo,
  Sparkles, ArrowRight, Gift, Trash2, Loader2, type LucideIcon,
} from "lucide-react";

// Activation checklist — HubSpot-style: each item is a BUSINESS OUTCOME, not a feature.
// Personalised order by segment, self-detecting completion from REAL data
// (demo rows tagged "[DEMO]" are excluded), progress bar, reward on 100%.
type StepKey = "clientes" | "transacoes" | "projetos" | "tarefas";

interface StepDef {
  table: string;
  demoCol: string; // column that carries the "[DEMO]" tag, for exclusion
  title: string;
  outcome: string;
  path: string;
  icon: LucideIcon;
}

const STEPS: Record<StepKey, StepDef> = {
  clientes:   { table: "clientes",   demoCol: "nome",        title: "Cadastre seu primeiro cliente",   outcome: "Comece seu CRM com histórico e insights", path: "/clientes",   icon: Users },
  transacoes: { table: "transacoes", demoCol: "description", title: "Lance sua primeira movimentação", outcome: "Veja seu fluxo de caixa na hora",          path: "/financas",   icon: DollarSign },
  projetos:   { table: "projetos",   demoCol: "name",        title: "Crie seu primeiro projeto",       outcome: "Acompanhe prazos e entregas dos clientes", path: "/projetos",   icon: FolderKanban },
  tarefas:    { table: "tarefas",    demoCol: "title",       title: "Adicione sua primeira tarefa",    outcome: "Organize a rotina da operação",            path: "/atividades", icon: ListTodo },
};

const ORDER_BY_SEGMENT: Record<string, StepKey[]> = {
  agencia:     ["clientes", "projetos", "transacoes", "tarefas"],
  consultoria: ["projetos", "clientes", "transacoes", "tarefas"],
  freelancer:  ["transacoes", "clientes", "tarefas", "projetos"],
  pme:         ["transacoes", "clientes", "tarefas", "projetos"],
};
const DEFAULT_ORDER: StepKey[] = ["clientes", "transacoes", "projetos", "tarefas"];

export function SetupGuide() {
  // Em modo demonstração, o guia de setup não faz sentido (não há dados reais para completar).
  const isDemo = typeof window !== "undefined" && sessionStorage.getItem("demo_mode") === "1";
  if (isDemo) return null;

  const { user } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<Record<StepKey, boolean> | null>(null);
  const [order, setOrder] = useState<StepKey[]>(DEFAULT_ORDER);
  const [hasDemo, setHasDemo] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);



  const dismissKey = user ? `hub_setupguide_done_${user.id}` : "";

  const load = useCallback(async () => {
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("segment").eq("user_id", user.id).maybeSingle();
    const seg = (prof?.segment || "").toLowerCase();
    setOrder(ORDER_BY_SEGMENT[seg] ?? DEFAULT_ORDER);

    const keys: StepKey[] = ["clientes", "transacoes", "projetos", "tarefas"];
    // Count REAL data only — exclude "[DEMO]" rows so activation reflects the user's own work.
    const results = await Promise.all(
      keys.map((k) =>
        (supabase as any).from(STEPS[k].table).select("id", { count: "exact", head: true })
          .eq("user_id", user.id).not(STEPS[k].demoCol, "ilike", "%[DEMO]%")
      )
    );
    const d = { clientes: false, transacoes: false, projetos: false, tarefas: false } as Record<StepKey, boolean>;
    keys.forEach((k, i) => { d[k] = (results[i].count ?? 0) > 0; });
    setDone(d);

    // Does the user still have demo/example data? (offer to clear it)
    const { count: demoCount } = await supabase.from("clientes").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).ilike("nome", "%[DEMO]%");
    setHasDemo((demoCount ?? 0) > 0);
  }, [user]);

  useEffect(() => {
    if (dismissKey && localStorage.getItem(dismissKey) === "1") setDismissed(true);
    load();
  }, [load, dismissKey]);

  const clearDemoData = async () => {
    if (!user) return;
    setClearing(true);
    try {
      await wipeDemoData("painel", user.id); // apaga todas as linhas "[DEMO]"
      markDemoCleared(user.id);              // impede o re-seed ("voltam tudo")
      await load();
    } finally {
      setClearing(false);
    }
  };

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
              {allDone ? "Você preencheu os módulos essenciais com dados reais." : `${completed} de ${total} passos · leva ~5 minutos`}
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
            <p className="text-sm font-medium text-foreground">Precisa de algo sob medida?</p>
            <p className="text-xs text-muted-foreground">O Hub é grátis. Se sua operação tem uma dor específica, a gente constrói.</p>
          </div>
          <Button size="sm" onClick={() => setCustomizeOpen(true)} className="gap-1 shrink-0">
            Conversar <ArrowRight className="w-3.5 h-3.5" />
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

      {/* D3 — dados de exemplo: rótulo claro + limpar de vez (sem "voltar") */}
      {hasDemo && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
          <span>Os itens marcados com <span className="font-mono text-foreground">[DEMO]</span> são exemplos.</span>
          <button
            onClick={clearDemoData}
            disabled={clearing}
            className="inline-flex items-center gap-1 text-destructive hover:underline disabled:opacity-50"
          >
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Limpar dados de exemplo
          </button>
        </div>
      )}

      <CustomizeDialog open={customizeOpen} onOpenChange={setCustomizeOpen} origem="app" />
    </div>
  );
}
