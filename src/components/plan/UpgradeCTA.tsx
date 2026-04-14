import { usePlan } from "@/contexts/PlanContext";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UpgradeCTA() {
  const { plan } = usePlan();
  const navigate = useNavigate();

  if (plan !== "gratuito") return null;

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <Button
        onClick={() => navigate("/planos")}
        className="gap-2 shadow-glow-strong rounded-full px-6"
        size="lg"
      >
        <Sparkles className="w-4 h-4" />
        Desbloqueie os recursos — Plano Plus
      </Button>
    </div>
  );
}
