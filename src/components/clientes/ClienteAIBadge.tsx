import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Crown, User, AlertTriangle, UserPlus } from "lucide-react";

interface ClienteAIBadgeProps {
  classificacao?: string | null;
  className?: string;
}

const classificacaoConfig = {
  vip: {
    label: "VIP",
    icon: Crown,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20",
  },
  padrao: {
    label: "Padrão",
    icon: User,
    className: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
  },
  em_risco: {
    label: "Em Risco",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20",
  },
  novo: {
    label: "Novo",
    icon: UserPlus,
    className: "bg-success/10 text-success border-success/30 hover:bg-success/20",
  },
};

export function ClienteAIBadge({ classificacao, className }: ClienteAIBadgeProps) {
  if (!classificacao || !classificacaoConfig[classificacao as keyof typeof classificacaoConfig]) {
    return null;
  }

  const config = classificacaoConfig[classificacao as keyof typeof classificacaoConfig];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium transition-colors",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
