import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "onboarding_prompt_dismissed";

export function OnboardingPrompt() {
  const { totalCompleted, loading } = useOnboardingProgress();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

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
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <Card className="w-80 p-5 shadow-lg border-primary/20 bg-card">
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-sm text-foreground">Quer ajuda para configurar seu Hub?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Nosso guia interativo te ajuda a dar os primeiros passos em menos de 5 minutos.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { dismiss(); navigate("/guia"); }}>
                Sim, me ajude
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
