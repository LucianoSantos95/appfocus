import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "onboarding_prompt_dismissed";

const SEGMENT_COPY: Record<string, { title: string; body: string }> = {
  agencia: {
    title: "Sua agência pode estar pronta em 5 minutos",
    body: "Configure pipeline de clientes, equipe e entregas com nosso guia interativo.",
  },
  consultoria: {
    title: "Estruture sua consultoria rapidamente",
    body: "Playbooks, propostas e acompanhamento de clientes em poucos cliques.",
  },
  freelancer: {
    title: "Pare de perder tempo com planilhas",
    body: "Centralize clientes, projetos e finanças em menos de 5 minutos.",
  },
  pme: {
    title: "Sua operação merece mais clareza",
    body: "Veja todos os times, processos e indicadores num único lugar.",
  },
};

const PAIN_COPY: Record<string, string> = {
  financeiro: "Comece pelo módulo financeiro e tenha o fluxo de caixa visível hoje mesmo.",
  clientes: "Organize seu funil e nunca mais perca uma oportunidade.",
  equipe: "Distribua tarefas e visualize a carga do time em tempo real.",
  processos: "Documente seus playbooks para escalar sem caos.",
};

export function OnboardingPrompt() {
  const { totalCompleted, loading } = useOnboardingProgress();
  const { session } = useOnboardingSession();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const copy = useMemo(() => {
    const base = (session?.segment && SEGMENT_COPY[session.segment]) || {
      title: "Quer ajuda para configurar seu Hub?",
      body: "Nosso guia interativo te ajuda a dar os primeiros passos em menos de 5 minutos.",
    };
    const painHint = session?.priority_pain ? PAIN_COPY[session.priority_pain] : null;
    return { ...base, body: painHint || base.body };
  }, [session]);

  useEffect(() => {
    if (loading) return;
    if (totalCompleted > 0) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(timer);
  }, [loading, totalCompleted]);

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-[49] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <Card className="w-80 p-5 shadow-lg border-primary/20 bg-card">
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-sm text-foreground">{copy.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{copy.body}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { dismiss(); navigate("/onboarding"); }}>
                Continuar onboarding
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Agora não
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
