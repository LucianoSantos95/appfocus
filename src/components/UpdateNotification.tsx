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
    icon: Zap,
    title: "Contas gratuitas: até 5 registros por módulo",
    description: "Agora usuários do plano gratuito podem incluir até 5 informações em cada módulo para experimentar o sistema.",
  },
  {
    icon: Sparkles,
    title: "Financeiro: Painel BI interativo",
    description: "Clique no gráfico de Evolução Financeira para abrir um painel detalhado com Lucratividade e Fluxo de Caixa Futuro.",
  },
  {
    icon: Zap,
    title: "Financeiro: Importação CSV/OFX",
    description: "Suba seu extrato bancário direto no sistema e elimine a digitação manual de transações.",
  },
  {
    icon: ShieldCheck,
    title: "RH: Gestão de Documentos",
    description: "Upload de contratos de trabalho e documentos (PDF/Imagens) diretamente no perfil do colaborador.",
  },
  {
    icon: Eye,
    title: "RH: Timeline de Férias e Aniversários",
    description: "Visão visual em calendário de quem está saindo de folga e datas de aniversário da equipe.",
  },
  {
    icon: Sparkles,
    title: "Marketing: Painel BI de Performance",
    description: "Clique no gráfico de Performance para ver comparativo de canais (Instagram vs. Indicação) e Custo de Aquisição (CAC) automático.",
  },
  {
    icon: Zap,
    title: "Marketing: Calendário de Conteúdo",
    description: "Planeje postagens da empresa com visualização mensal estilo Google Agenda.",
  },
  {
    icon: Sparkles,
    title: "Projetos: Painel BI de Status",
    description: "Clique no gráfico de Status de Projeto para abrir análise detalhada de todos os projetos.",
  },
  {
    icon: ShieldCheck,
    title: "Projetos: Anexos centralizados",
    description: "Centralize briefings e arquivos importantes dentro de cada projeto.",
  },
  {
    icon: Sparkles,
    title: "CRM: Painel BI de Clientes",
    description: "Funil de Vendas visual e ranking dos maiores clientes acessíveis pelo gráfico de Receita por Cliente.",
  },
  {
    icon: Eye,
    title: "CRM: Anotações de Reunião",
    description: "Campo de texto rico para registrar o que foi conversado em cada call, integrado ao perfil do cliente.",
  },
  {
    icon: Zap,
    title: "Guia de uso atualizado",
    description: "Novo guia interativo com passo a passo de todas as funcionalidades do sistema.",
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
