import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle2, Circle, Gift, Sparkles } from "lucide-react";
import type { OnboardingSession } from "@/hooks/useOnboardingSession";

const SEGMENT_ROUTES: Record<string, string[]> = {
  agencia: ["projetos", "clientes", "financas"],
  consultoria: ["clientes", "processos", "financas"],
  freelancer: ["tarefas", "financas", "clientes"],
  pme: ["financas", "rh", "marketing"],
};

const MODULE_LABELS: Record<string, string> = {
  projetos: "Projetos", clientes: "Clientes", financas: "Finanças",
  processos: "Processos", tarefas: "Atividades", rh: "RH", marketing: "Marketing",
};

const ACHIEVEMENTS: Record<string, { label: string; emoji: string }> = {
  first_step: { label: "Primeiro Passo", emoji: "🏆" },
  financial_manager: { label: "Gestor Financeiro", emoji: "📊" },
  networker: { label: "Networker", emoji: "🤝" },
  operation_running: { label: "Operação Rodando", emoji: "🚀" },
};

interface Props {
  session: OnboardingSession;
}

export function OnboardingProgressBar({ session }: Props) {
  const route = SEGMENT_ROUTES[session.segment || "pme"] || SEGMENT_ROUTES.pme;
  const completed = session.completed_modules || [];
  const total = route.length;
  const percent = session.current_step === "welcome" ? 10 :
    session.current_step === "completed" ? 100 :
    Math.round((completed.length / total) * 80 + 20);
  const currentModule = route[completed.length] || route[route.length - 1];
  const remaining = Math.max(total - completed.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Progresso do Onboarding</span>
        <span className="text-sm text-primary font-bold">{percent}%</span>
      </div>
      <Progress value={percent} className="h-3" />

      <div className="grid gap-3 rounded-lg border border-border/60 bg-card/40 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Etapa atual</p>
          <p className="text-sm font-semibold text-foreground">{MODULE_LABELS[currentModule] || currentModule}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Checklist concluído</p>
          <p className="text-sm font-semibold text-foreground">{completed.length} de {total} passos</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Faltam</p>
          <p className="text-sm font-semibold text-foreground">{remaining} {remaining === 1 ? "etapa" : "etapas"}</p>
        </div>
      </div>

      {/* Module steps */}
      <div className="flex justify-between">
        {route.map((mod, i) => {
          const isDone = completed.includes(mod);
          const isCurrent = completed.length === i && session.current_step !== "completed";
          return (
            <div key={mod} className="flex flex-col items-center gap-1">
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : isCurrent ? (
                <Circle className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={`text-xs ${isDone ? "text-green-500" : isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                {MODULE_LABELS[mod] || mod}
              </span>
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      {session.achievements && session.achievements.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {session.achievements.map((a) => {
            const ach = ACHIEVEMENTS[a];
            if (!ach) return null;
            return (
              <Badge key={a} variant="secondary" className="gap-1 text-xs">
                <Trophy className="h-3 w-3" />
                {ach.emoji} {ach.label}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
