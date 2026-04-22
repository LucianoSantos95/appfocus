import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

export interface WowMoment {
  module: string;
  headline: string;
  metric?: string;
  subline?: string;
}

interface Props {
  moment: WowMoment | null;
  onDismiss: () => void;
}

/**
 * Quantified victory card shown right after a meaningful action in onboarding.
 * Triggers confetti on appear to anchor the "aha" moment.
 */
export function WowMomentCard({ moment, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!moment) return;
    setVisible(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#3b82f6", "#60a5fa", "#a78bfa"],
    });
    const t = setTimeout(() => handleClose(), 9000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 250);
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
                Momento WOW
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
      };
    case "clientes":
      return {
        module,
        headline: "Seu primeiro cliente está no Hub 🤝",
        metric: metadata.nome ? `${metadata.nome}` : "CRM iniciado",
        subline: `A partir daqui, a IA já consegue sugerir próximas ações ${timeStr}.`,
      };
    case "projetos":
      return {
        module,
        headline: "Operação saindo do papel 🚀",
        metric: "Projeto criado",
        subline: `Prazos, orçamento e responsáveis prontos para acompanhar ${timeStr}.`,
      };
    case "tarefas":
      return {
        module,
        headline: "Sua execução já tem foco ✅",
        metric: "Primeira tarefa",
        subline: `Você acabou de transformar caos em prioridade ${timeStr}.`,
      };
    case "rh":
      return {
        module,
        headline: "Time mapeado, gestão liberada 👥",
        metric: "Equipe no Hub",
        subline: `Documentos, férias e onboarding centralizados ${timeStr}.`,
      };
    case "marketing":
      return {
        module,
        headline: "Sua máquina de marketing começou 📣",
        metric: "Campanha ativa",
        subline: `Calendário de conteúdo e métricas a um clique ${timeStr}.`,
      };
    default:
      return {
        module,
        headline: "Mais um passo conquistado 🎯",
        metric: "Módulo configurado",
        subline: `Você está construindo sua operação ${timeStr}.`,
      };
  }
}
