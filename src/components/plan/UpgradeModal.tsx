import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  maxCount: number;
  moduleName?: string;
}

export function UpgradeModal({ open, onOpenChange, currentCount, maxCount, moduleName }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border text-center">
        <DialogHeader className="items-center space-y-4 pt-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Limite atingido
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm max-w-[320px] mx-auto">
            Você atingiu o limite de <span className="font-semibold text-foreground">{maxCount} registros</span>
            {moduleName ? ` em ${moduleName}` : ""} do plano gratuito.
            Faça upgrade para adicionar registros ilimitados e desbloquear todos os recursos.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/50 p-4 my-2 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Registros utilizados</span>
            <span className="font-semibold text-foreground">{currentCount}/{maxCount}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min((currentCount / maxCount) * 100, 100)}%` }}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/planos");
            }}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Fazer Upgrade
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Continuar no plano gratuito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
