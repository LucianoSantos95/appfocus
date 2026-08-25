import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "@/components/user/FeedbackDialog";

// MVP: coletar o máximo de feedback possível. O mesmo formulário é aberto
// pelo botão flutuante e pelo link do rodapé.
export function BotaoFeedbackFlutuante() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Enviar feedback"
        className="focus-label fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated/90 px-4 py-2.5 text-foreground shadow-premium backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>
      <FeedbackDialog
        open={aberto}
        onOpenChange={setAberto}
        placeholder="O que achou do Hub Central? O que faltou pra você?"
      />
    </>
  );
}

export function LinkFeedback({ className = "" }: { className?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className={`focus-label text-muted-foreground transition-colors hover:text-foreground ${className}`}
      >
        Enviar feedback
      </button>
      <FeedbackDialog
        open={aberto}
        onOpenChange={setAberto}
        placeholder="O que achou do Hub Central? O que faltou pra você?"
      />
    </>
  );
}
