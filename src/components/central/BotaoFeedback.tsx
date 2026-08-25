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
        className="focus-label animate-idle-pulse fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg ring-1 ring-primary/40 transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span>Feedback</span>
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
