import { ReactNode } from "react";
import { usePlan } from "@/contexts/PlanContext";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";

interface PlanGateProps {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGate({ module, action, children, fallback }: PlanGateProps) {
  const { canAccess, plan } = usePlan();
  const navigate = useNavigate();
  const { isAdmin } = useTeamPermissions();

  // Free users can always create records — useFreemiumLimit handles the count gate.
  const isFreeCreate = plan === "gratuito" && action === "create";

  if (isAdmin || isFreeCreate || canAccess(module, action)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  const planNames: Record<string, string> = {
    export: "Pro",
    ai_analysis: "Pro",
    api: "Enterprise",
  };

  const requiredPlan = planNames[action] || "Plus";

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-[6px]">
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/50">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-semibold text-sm">
          Disponível no plano {requiredPlan}
        </p>
        <Button
          onClick={() => navigate("/planos")}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Ver planos
        </Button>
      </div>
    </div>
  );
}
