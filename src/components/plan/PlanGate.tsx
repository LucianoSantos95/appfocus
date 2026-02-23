import { ReactNode } from "react";
import { usePlan } from "@/contexts/PlanContext";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanGateProps {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGate({ module, action, children, fallback }: PlanGateProps) {
  const { canAccess, plan } = usePlan();
  const navigate = useNavigate();

  if (canAccess(module, action)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  const planNames: Record<string, string> = {
    create: "Plus",
    export: "Pro",
    ai_analysis: "Pro",
    api: "Enterprise",
  };

  const requiredPlan = planNames[action] || "Plus";

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-card/50 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Funcionalidade exclusiva do plano {requiredPlan}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Faça upgrade para o plano {requiredPlan} e desbloqueie esta funcionalidade.
      </p>
      <Button onClick={() => navigate("/planos")} className="gap-2">
        <Sparkles className="w-4 h-4" />
        Conhecer Planos
      </Button>
    </div>
  );
}
