import { Button } from "@/components/ui/button";
import { ArrowRight, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoData } from "@/contexts/DemoDataContext";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";

export function DemoCouponBanner() {
  const navigate = useNavigate();
  const { clearDemo } = useDemoData();
  const { finalizeOnboarding } = useOnboardingSession();

  const handleSubscribe = async () => {
    await finalizeOnboarding();
    clearDemo();
    navigate("/planos");
  };

  const handleStartReal = async () => {
    await finalizeOnboarding();
    clearDemo();
  };

  return (
    <div
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b backdrop-blur-sm"
      style={{
        background: "linear-gradient(135deg, rgba(79,126,255,0.15), rgba(99,102,241,0.10))",
        borderBottomColor: "rgba(79,126,255,0.25)",
      }}
    >
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Gift className="h-4 w-4 text-primary shrink-0" />
        <span>
          <span className="hidden sm:inline">Seu cupom de boas-vindas: </span>
          <span className="font-mono font-bold text-primary">FOCUS20</span>
          <span> — 20% OFF no primeiro mês</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleStartReal}>
          Começar com meus dados reais
        </Button>
        <Button size="sm" onClick={handleSubscribe} className="gap-1.5">
          Assinar agora com desconto
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
