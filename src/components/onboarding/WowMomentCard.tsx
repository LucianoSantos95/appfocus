import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, TrendingUp, Check, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/lib/demo-fixtures";

export interface WowMoment {
  module: string;
  headline: string;
  metric?: string;
  subline?: string;
  insight?: string;
  emoji?: string;
}

interface Props {
  moment: WowMoment | null;
  onDismiss: () => void;
}

/**
 * Quantified victory card shown right after a meaningful action in onboarding.
 * Triggers confetti on appear to anchor the "aha" moment.
 * Also captures WhatsApp opt-in AFTER the user has seen value (not before).
 */
export function WowMomentCard({ moment, onDismiss }: Props) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [phoneNeeded, setPhoneNeeded] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    if (!moment) return;
    setVisible(true);
    setPhoneSaved(false);
    setPhone("");
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#3b82f6", "#60a5fa", "#a78bfa"],
    });
    const t = setTimeout(() => handleClose(), 15000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment]);

  // Fetch profile phone once to decide whether to show the WhatsApp prompt.
  useEffect(() => {
    if (!moment || !user || isDemoMode()) { setPhoneNeeded(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setPhoneNeeded(!data?.phone);
    })();
    return () => { cancelled = true; };
  }, [moment, user]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 250);
  };

  const handleSavePhone = async () => {
    if (!user) return;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return;
    setPhoneSaving(true);
    await supabase.from("profiles").update({ phone: digits }).eq("user_id", user.id);
    setPhoneSaving(false);
    setPhoneSaved(true);
  };

  if (!moment) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] w-[min(380px,calc(100vw-2rem))] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Card className="relative p-5 border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card shadow-xl shadow-primary/20 overflow-hidden">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-start gap-3">
          <div className="rounded-full bg-primary/20 p-2.5 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-primary">
                Demo configurada
              </span>
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground leading-snug">{moment.headline}</p>
            {moment.metric && (
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {moment.metric}
              </p>
            )}
            {moment.subline && (
              <p className="text-xs text-muted-foreground leading-relaxed">{moment.subline}</p>
            )}
            {moment.insight && (
              <div className="rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs text-foreground/90">
                <span className="font-medium">{moment.emoji || "✨"} Insight imediato:</span> {moment.insight}
              </div>
            )}

            {phoneNeeded && !phoneSaved && (
              <div className="mt-2 rounded-lg border border-primary/30 bg-card/70 p-3 space-y-2">
                <p className="text-[11px] font-medium text-foreground">
                  📱 Receber alertas no WhatsApp?
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    onClick={handleSavePhone}
                    disabled={phoneSaving || phone.replace(/\D/g, "").length < 10}
                    className="h-8 px-3 text-xs"
                  >
                    {phoneSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ativar"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Só avisos úteis. Sem spam.</p>
              </div>
            )}
            {phoneSaved && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                <Check className="h-3.5 w-3.5" /> WhatsApp cadastrado
              </div>
            )}

            <Button size="sm" variant="ghost" onClick={handleClose} className="h-7 px-2 text-xs mt-1">
              Continuar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/** Build a personalized victory phrase based on the module just completed and TTV seconds. */
export function buildWowMoment(
  module: string,
  ttvSeconds: number | null,
  metadata: Record<string, any> = {}
): WowMoment {
  const timeStr = ttvSeconds && ttvSeconds < 600
    ? `em apenas ${Math.max(1, Math.round(ttvSeconds / 60))} min`
    : "";

  switch (module) {
    case "financas":
      return {
        module,
        headline: "Você acabou de mapear sua primeira receita 💰",
        metric: metadata.value ? `R$ ${Number(metadata.value).toLocaleString("pt-BR")}` : "Finanças ativas",
        subline: `Seu fluxo de caixa começou a ganhar vida ${timeStr}. Continue para liberar relatórios automáticos.`,
        insight: metadata.insight,
        emoji: metadata.emoji,
      };
    case "clientes":
      return {
        module,
        headline: "Seu primeiro cliente está no Hub 🤝",
        metric: metadata.nome ? `${metadata.nome}` : "CRM iniciado",
        subline: `A partir daqui, a IA já consegue sugerir próximas ações ${timeStr}.`,
        insight: metadata.insight,
        emoji: metadata.emoji,
      };
    case "projetos":
      return {
        module,
        headline: "Operação saindo do papel 🚀",
        metric: "Projeto criado",
        subline: `Prazos, orçamento e responsáveis prontos para acompanhar ${timeStr}.`,
        insight: metadata.insight,
        emoji: metadata.emoji,
      };
    case "tarefas":
      return {
        module,
        headline: "Sua execução já tem foco ✅",
        metric: "Primeira tarefa",
        subline: `Você acabou de transformar caos em prioridade ${timeStr}.`,
        insight: metadata.insight,
        emoji: metadata.emoji,
      };
    case "rh":
      return {
        module,
        headline: "Time mapeado, gestão liberada 👥",
        metric: "Equipe no Hub",
        subline: `Documentos, férias e onboarding centralizados ${timeStr}.`,
        insight: metadata.insight,
        emoji: metadata.emoji,
      };
    case "marketing":
      return {
        module,
        headline: "Sua máquina de marketing começou 📣",
        metric: "Campanha ativa",
        subline: `Calendário de conteúdo e métricas a um clique ${timeStr}.`,
        insight: metadata.insight,
        emoji: metadata.emoji,
      };
    default:
      return {
        module,
        headline: "Mais um passo conquistado 🎯",
        metric: "Módulo configurado",
        subline: `Você está construindo sua operação ${timeStr}.`,
        insight: metadata.insight,
        emoji: metadata.emoji,
      };
  }
}
