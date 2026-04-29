import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Lock } from "lucide-react";
import type { OnboardingSession } from "@/hooks/useOnboardingSession";

interface Props {
  session: OnboardingSession;
}

/**
 * Preview do cupom de 20% mostrado DURANTE o onboarding (antes da conclusão).
 * Cria antecipação e reduz drop-off no primeiro módulo.
 */
export function OnboardingCouponPreview({ session }: Props) {
  // Esconde se já completou (aí mostra o banner real) ou se ainda não há sessão
  if (!session || session.current_step === "completed") return null;

  const completed = session.completed_modules?.length || 0;
  const total = 3;
  const percent = Math.round((completed / total) * 100);

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/15 via-primary/5 to-card border-primary/30 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className="rounded-full bg-primary/20 p-2.5 shrink-0 border border-primary/30">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-foreground text-sm">
              🎁 Recompensa: 20% OFF no seu primeiro mês
            </span>
            <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Preview
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>
              Complete os 3 módulos para desbloquear (
              <span className="font-semibold text-foreground">{completed}/{total}</span>
              {" • "}
              <span className="text-primary font-medium">{percent}%</span>
              )
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
