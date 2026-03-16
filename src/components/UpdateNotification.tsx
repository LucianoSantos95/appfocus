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
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Eye } from "lucide-react";

const UPDATE_KEY = "focus_update_dismissed";
const UPDATE_VERSION = "2026-03-16"; // Change this on each new release
const EXPIRY_DAYS = 5;

const updates = [
  {
    icon: Sparkles,
    title: "Dados fictícios em todos os módulos",
    description: "Todos os módulos agora vêm pré-populados com dados de exemplo para facilitar a exploração: Finanças, RH, Marketing, Projetos, Clientes, Atividades, Processos e Painel.",
  },
  {
    icon: Zap,
    title: "Performance geral otimizada",
    description: "Carregamento mais rápido com importações dinâmicas de bibliotecas pesadas (PDF e planilhas), cache inteligente e redução de requisições ao servidor.",
  },
  {
    icon: ShieldCheck,
    title: "Estabilidade e segurança reforçadas",
    description: "Corrigido problema crítico no módulo Financeiro, reforçada tipagem em todos os hooks de dados e adicionadas barreiras de erro para evitar travamentos.",
  },
  {
    icon: Eye,
    title: "Acessibilidade dos diálogos",
    description: "Todos os diálogos e modais do sistema foram ajustados para melhor compatibilidade com leitores de tela.",
  },
  {
    icon: Sparkles,
    title: "Popup de novidades",
    description: "Agora você será notificado sempre que houver atualizações importantes no sistema.",
  },
];

export function UpdateNotification() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
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
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(
      UPDATE_KEY,
      JSON.stringify({ version: UPDATE_VERSION, dismissedAt: new Date().toISOString() })
    );
    setOpen(false);
  };

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
