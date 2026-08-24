import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

// Faixa para quem chega do Hub Empresarial (SaaS descontinuado).
// Detecta pela sessão do Supabase ou pelas chaves que o Hub deixava no
// localStorage — visitante novo, vindo do Notion Marketplace, nunca vê isso.
const CHAVE_DISPENSADO = "hub_aviso_encerramento_lido";

function veioDoHubAntigo(): boolean {
  try {
    return Object.keys(localStorage).some(
      (k) =>
        k.startsWith("sb-") && k.includes("auth-token") ||   // sessão do Supabase
        k.startsWith("onb_visited_") ||                       // onboarding do Hub
        k.startsWith("hub_demo_cleared_") ||
        k === "hubTourCompleted",
    );
  } catch {
    return false;
  }
}

export function AvisoHubAntigo() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE_DISPENSADO) === "1") return;
    } catch { /* sem storage: não insiste */ }
    setMostrar(veioDoHubAntigo());
  }, []);

  if (!mostrar) return null;

  const dispensar = () => {
    try { localStorage.setItem(CHAVE_DISPENSADO, "1"); } catch { /* ignora */ }
    setMostrar(false);
  };

  return (
    <div className="border-b border-border/60 bg-muted/40">
      <div className="mx-auto max-w-5xl px-6 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">O Hub Empresarial saiu do ar.</span>{" "}
          Seus dados estão guardados e você pode pedir uma cópia quando quiser —
          é só escrever para{" "}
          <a
            href="mailto:comercial@focusinteligente.com.br?subject=Meus%20dados%20do%20Hub%20Empresarial"
            className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            comercial@focusinteligente.com.br
          </a>.
        </p>
        <button
          onClick={dispensar}
          aria-label="Dispensar aviso"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
