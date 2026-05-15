import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Users, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Segment = "engaged" | "inactive";

interface Preview {
  total_recipients: number;
  sample: Array<{ email: string; name: string | null }>;
  template: string;
  subject: string;
}

const CONFIG: Record<Segment, { title: string; desc: string; cta: string; badge: string; icon: typeof Sparkles }> = {
  engaged: {
    title: "Oferta 20% OFF — Engajados",
    desc: "Usuários ativos no plano gratuito que ainda não assinaram. E-mail com cupom Stripe (20% off por 3 meses).",
    cta: "Disparar campanha de oferta",
    badge: "Promocional",
    icon: Sparkles,
  },
  inactive: {
    title: "Reativação — Inativos",
    desc: "Usuários sem atividade recente. E-mail com novidades do Hub e surpresa ao concluir o onboarding.",
    cta: "Disparar reativação",
    badge: "Reativação",
    icon: Megaphone,
  },
};

export function CampanhaPromoCard({ segment }: { segment: Segment }) {
  const { session } = useAuth();
  const cfg = CONFIG[segment];
  const Icon = cfg.icon;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadPreview = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-promo-campaign", {
        body: { segment, dryRun: true },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setPreview(data as Preview);
    } catch (e) {
      toast.error("Erro ao carregar prévia da campanha.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const dispatch = async () => {
    if (!session?.access_token) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-promo-campaign", {
        body: { segment, dryRun: false },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const r = data as { sent: number; failed: number; skipped: number };
      toast.success(`Campanha enviada: ${r.sent} enviados, ${r.skipped} pulados, ${r.failed} falhas.`);
      setPreview(null);
    } catch (e) {
      toast.error("Erro ao disparar campanha.");
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {cfg.title}
              <Badge variant="outline" className="text-xs">{cfg.badge}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{cfg.desc}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" size="sm" onClick={loadPreview} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
          Calcular destinatários
        </Button>

        {preview && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Destinatários elegíveis</span>
              <span className="font-bold text-foreground text-lg">{preview.total_recipients}</span>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-2">
              <strong>Assunto:</strong> {preview.subject}
            </div>
            {preview.sample.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <strong>Amostra:</strong> {preview.sample.map((s) => s.email).join(", ")}
                {preview.total_recipients > preview.sample.length && "…"}
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="w-full mt-2" disabled={sending || preview.total_recipients === 0}>
                  {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {cfg.cta} ({preview.total_recipients})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar envio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a enviar <strong>{preview.total_recipients} e-mails</strong> da campanha
                    "{cfg.title}". Destinatários que já receberam serão pulados automaticamente. Esta ação não pode
                    ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={dispatch}>Confirmar envio</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
