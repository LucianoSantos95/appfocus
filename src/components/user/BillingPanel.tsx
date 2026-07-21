import { useState } from "react";
import { usePlan } from "@/contexts/PlanContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Sparkles, XCircle } from "lucide-react";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import { useNavigate } from "react-router-dom";

interface BillingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const planDetails: Record<string, { label: string; price: string; color: string }> = {
  gratuito: { label: "Gratuito", price: "R$0", color: "secondary" },
  plus: { label: "Plus", price: "R$69/mês", color: "default" },
  pro: { label: "Pro", price: "R$149/mês", color: "default" },
  enterprise: { label: "Enterprise", price: "R$297/mês", color: "default" },
};

export function BillingPanel({ open, onOpenChange }: BillingPanelProps) {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const details = planDetails[plan] || planDetails.gratuito;
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Faturamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          <div className="p-5 rounded-xl border border-border bg-card/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-semibold">Plano Atual</span>
              </div>
              <Badge variant={details.color as any}>{details.label}</Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{details.price}</p>
            <p className="text-xs text-muted-foreground">
              Pagamento via Pix, Boleto ou Cartão de crédito
            </p>
          </div>

          {plan === "gratuito" && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center space-y-2">
              <Sparkles className="w-5 h-5 text-primary mx-auto" />
              <p className="text-sm font-semibold text-primary">Desbloqueie todos os recursos</p>
              <p className="text-xs text-muted-foreground">Faça upgrade para criar, editar e exportar dados.</p>
              <Button
                onClick={() => { onOpenChange(false); navigate("/planos"); }}
                className="mt-2"
              >
                Ver Planos
              </Button>
            </div>
          )}

          {plan !== "gratuito" && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { onOpenChange(false); navigate("/planos"); }}
              >
                Trocar de plano
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="w-4 h-4" />
                Cancelar Plano
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Para trocar o método de pagamento (Pix/Boleto/Cartão), cancele e assine novamente.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
      <CancelSubscriptionDialog open={cancelOpen} onOpenChange={setCancelOpen} />
    </Dialog>
  );
}
