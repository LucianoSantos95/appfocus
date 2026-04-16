import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Eye, Bot, Mic, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";

const UPDATE_KEY = "focus_update_dismissed";
const UPDATE_VERSION = "2026-04-14";
const EXPIRY_DAYS = 5;

const updates = [
  {
    icon: Bot,
    title: "Assistente de IA com voz",
    description: "Converse com o Hub por texto ou voz. O assistente cria registros, responde dúvidas e executa ações em todos os módulos.",
  },
  {
    icon: Globe,
    title: "Integração Google Workspace",
    description: "Conecte Gmail e Google Calendar para sincronizar e-mails e eventos diretamente no Hub.",
  },
  {
    icon: Zap,
    title: "Histórico de atividades completo",
    description: "Veja quem fez o quê — timeline com nome do usuário e filtro por módulo, com pop-up de histórico completo.",
  },
  {
    icon: Eye,
    title: "Guia de Uso atualizado",
    description: "Novo estágio do Assistente de IA no guia interativo, com checklist e dicas para aproveitar ao máximo.",
  },
  {
    icon: ShieldCheck,
    title: "Botão de upgrade centralizado",
    description: "O CTA de recursos premium agora fica centralizado na tela, sem sobrepor outros elementos.",
  },
  {
    icon: Sparkles,
    title: "Logo do Hub no chat",
    description: "O assistente de IA agora usa a identidade visual oficial do Focus Hub para uma experiência mais integrada.",
  },
];

export function UpdateNotification() {
  const [open, setOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { isOnboardingComplete, loading: onbLoading, session } = useOnboardingSession();

  useEffect(() => {
    // Only show for authenticated users
    if (isLoading || !user) return;

    try {
      const stored = localStorage.getItem(UPDATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === UPDATE_VERSION) {
          const dismissedAt = new Date(parsed.dismissedAt);
          const now = new Date();
          const diffDays = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays < EXPIRY_DAYS) return;
        }
      }
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [user, isLoading]);

  const handleDismiss = () => {
    localStorage.setItem(
      UPDATE_KEY,
      JSON.stringify({ version: UPDATE_VERSION, dismissedAt: new Date().toISOString() })
    );
    setOpen(false);
  };

  // Don't render at all if not authenticated
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-foreground">
            Novidades da Atualização 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm">
            Confira as melhorias que acabamos de implementar no Focus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2 max-h-[320px] overflow-y-auto pr-1">
          {updates.map((item, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-center pt-2">
          <Button onClick={handleDismiss} className="gap-2 px-8">
            <CheckCircle2 className="w-4 h-4" />
            Entendi, obrigado!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
