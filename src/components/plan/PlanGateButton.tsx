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
  const { canAccess } = usePlan();
  const { isAdmin } = useTeamPermissions();
  const navigate = useNavigate();

  if (isAdmin || canAccess(module, action)) {
    return <>{children}</>;
  }

  const planNames: Record<string, string> = {
    create: "Plus",
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
            className="relative inline-flex cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/planos");
            }}
          >
            {/* Render children but disable interaction */}
            <div className="pointer-events-none opacity-60">
              {children}
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center">
                <Lock className="w-3 h-3 text-primary-foreground" />
              </div>
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
