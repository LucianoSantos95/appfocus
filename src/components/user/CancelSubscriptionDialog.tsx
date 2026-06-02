import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { toast } from "sonner";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOTIVOS = [
  "Muito caro para o meu momento",
  "Não estou usando o suficiente",
  "Faltam recursos que preciso",
  "Encontrei uma alternativa melhor",
  "Problemas técnicos / bugs",
  "Apenas testei, não era para mim",
  "Outro",
];

export function CancelSubscriptionDialog({ open, onOpenChange }: CancelSubscriptionDialogProps) {
  const { user, session } = useAuth();
  const { plan, refreshSubscription } = usePlan();
  const [motivo, setMotivo] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setMotivo("");
    setComentario("");
  };

  const handleConfirm = async () => {
    if (!motivo) {
      toast.error("Por favor, selecione um motivo");
      return;
    }
    if (!user || !session?.access_token) return;

    setLoading(true);
    try {
      // 1. Save feedback
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const nome = profile?.display_name || user.email?.split("@")[0] || "Usuário";

      const { error: feedbackError } = await supabase.from("cancellation_feedback").insert({
        user_id: user.id,
        nome,
        email: user.email ?? "",
        plano_anterior: plan,
        motivo,
        comentario: comentario.trim() || null,
      });
      if (feedbackError) throw feedbackError;

      // 2. Cancel subscription
      const { error: cancelError } = await supabase.functions.invoke("cancel-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (cancelError) throw cancelError;

      toast.success("Assinatura cancelada. Obrigado pelo seu feedback!");
      await refreshSubscription();
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error("Não foi possível concluir o cancelamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!loading) {
          if (!o) reset();
          onOpenChange(o);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Cancelar assinatura</DialogTitle>
              <DialogDescription>
                Sentimos muito em ver você ir. Conte o que motivou sua decisão.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do cancelamento *</Label>
            <Select value={motivo} onValueChange={setMotivo} disabled={loading}>
              <SelectTrigger id="motivo">
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentario">Quer detalhar? (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Seu feedback nos ajuda a melhorar..."
              rows={4}
              maxLength={1000}
              disabled={loading}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Ao confirmar, sua assinatura será cancelada imediatamente e você voltará ao plano gratuito.
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Manter assinatura
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={loading || !motivo}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar cancelamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
