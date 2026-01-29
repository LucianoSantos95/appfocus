import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradeBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl gradient-primary p-6 shadow-premium">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Você está usando a versão inicial do Hub Empresarial
            </h3>
            <p className="text-sm text-white/80 mt-1">
              Evolua para uma gestão mais inteligente com o Hub Empresarial Pro.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded font-mono">
                Cupom: FOCUS20
              </span>
              <span className="text-xs text-white/60">20% de desconto</span>
            </div>
          </div>
        </div>
        <Button 
          className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
        >
          Evoluir para o Pro
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
