import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { CustomizeDialog } from "./CustomizeDialog";

// CTA persistente do app. Ocupa o lugar do antigo UpgradeCTA ("Desbloqueie —
// Plano Plus"): o Hub agora é 100% gratuito, então o único convite é customizar.
export function CustomizeCTA() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="conic-border rounded-full">
          <Button
            onClick={() => setOpen(true)}
            className="gap-2 shadow-glow-strong rounded-full px-6"
            size="lg"
          >
            <Sparkles className="w-4 h-4" />
            Quero um sistema sob medida
          </Button>
        </div>
      </div>
      <CustomizeDialog open={open} onOpenChange={setOpen} origem="app" />
    </>
  );
}
