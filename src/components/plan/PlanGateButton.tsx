import { ReactNode } from "react";
import { usePlan } from "@/contexts/PlanContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlanGateButtonProps {
  module: string;
  action: string;
  children: ReactNode;
}

/**
 * Wrapper inline para botões protegidos pelo plano.
 * - Se o usuário tem acesso: renderiza children normalmente.
 * - Se não: intercepta o clique, mostra cadeado e redireciona para /planos.
 */
export function PlanGateButton({ module, action, children }: PlanGateButtonProps) {
  const { canAccess, plan } = usePlan();
  const { isAdmin } = useTeamPermissions();
  const navigate = useNavigate();

  // Free users can always create records — useFreemiumLimit handles the count gate.
  const isFreeCreate = plan === "gratuito" && action === "create";

  if (isAdmin || isFreeCreate || canAccess(module, action)) {
    return <>{children}</>;
  }

  const planNames: Record<string, string> = {
    export: "Pro",
    ai_analysis: "Pro",
    api: "Enterprise",
  };
  const requiredPlan = planNames[action] || "Plus";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex items-center gap-1.5 cursor-pointer opacity-60"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/planos");
            }}
          >
            <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <div className="pointer-events-none">
              {children}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Disponível no plano {requiredPlan}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
