import { useState } from "react";
import { usePlan } from "@/contexts/PlanContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BillingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const planDetails: Record<string, { label: string; price: string; color: string }> = {
  gratuito: { label: "Gratuito", price: "R$0", color: "secondary" },
  plus: { label: "Plus", price: "R$119/mês", color: "default" },
  pro: { label: "Pro", price: "R$249/mês", color: "default" },
  enterprise: { label: "Enterprise", price: "R$497/mês", color: "default" },
};

export function BillingPanel({ open, onOpenChange }: BillingPanelProps) {
  const { plan, subscriptionEnd } = usePlan();
  const { session } = useAuth();
  const navigate = useNavigate();
  const details = planDetails[plan] || planDetails.gratuito;
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    if (!session?.access_token) return;
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || !data?.url) throw new Error("Erro ao abrir portal");
      // Mesma aba evita bloqueio de popup após await
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir portal de gerenciamento");
      setPortalLoading(false);
    }
  };

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
            {plan !== "gratuito" && subscriptionEnd && (
              <p className="text-sm text-muted-foreground">
                Próximo pagamento: {format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
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
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Gerenciar Assinatura
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
