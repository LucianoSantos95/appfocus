import { useEffect, useState } from "react";
import { X, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PendingMessage {
  module: string;
  content: string;
}

export function AssistantWelcomeBanner() {
  const [message, setMessage] = useState<PendingMessage | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("hub_assistant_pending_message");
    if (!raw) return;
    try {
      const parsed: PendingMessage = JSON.parse(raw);
      localStorage.removeItem("hub_assistant_pending_message");
      setMessage(parsed);
      // Slight delay so the page transition completes before the banner slides in
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    } catch {
      localStorage.removeItem("hub_assistant_pending_message");
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setMessage(null), 300);
  };

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-[60] w-[min(360px,calc(100vw-3rem))] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="rounded-2xl border border-primary/20 bg-card shadow-xl shadow-black/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-primary/5">
          <div className="rounded-full bg-primary/15 p-1.5 shrink-0">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Assistente Hub</span>
          <button
            onClick={handleClose}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar assistente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-3 max-h-60 overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>p]:leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
