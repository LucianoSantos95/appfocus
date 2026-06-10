import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FreemiumWarningBannerProps {
  currentCount: number;
  maxCount: number;
  moduleName: string;
}

export function FreemiumWarningBanner({ currentCount, maxCount, moduleName }: FreemiumWarningBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-warning/10 border border-warning/30 rounded-lg text-sm">
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <span className="text-foreground">
          Você usou <strong>{currentCount}/{maxCount}</strong> registros gratuitos em {moduleName}.{" "}
          <span className="text-muted-foreground">Ao atingir o limite, novos cadastros serão bloqueados.</span>
        </span>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-warning/40 hover:bg-warning/10"
        onClick={() => navigate("/planos")}
      >
        Ver planos
      </Button>
    </div>
  );
}
