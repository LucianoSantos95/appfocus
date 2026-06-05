import { useState, useRef, useEffect, useCallback } from "react";
import { SendHorizonal, X, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "./ChatMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import hubLogo from "@/assets/logo.png";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "O que está atrasado?",
  "Resumo da minha operação",
  "Criar tarefa",
  "Adicionar cliente",
];

export function AIChatWidget() {
  const { session } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Draggable position (desktop only). Persisted across navigation.
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem("hub_assistant_position");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { x: 0, y: 0 };
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pendingVoiceRef = useRef<string | null>(null);

  const handleVoiceResult = useCallback((text: string) => {
    pendingVoiceRef.current = text;
    setInput(text);
  }, []);

  const { isListening, isSupported: micSupported, transcript, startListening, stopListening } =
    useSpeechRecognition(handleVoiceResult);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const onDragPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return;
    // Ignore drags initiated on the close button
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setIsDragging(true);
  }, [isMobile, pos.x, pos.y]);

  const onDragPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    // Bounds: keep widget visible (~400x500). Allow negative x/y up to viewport.
    const maxX = 0;
    const minX = -(window.innerWidth - 440);
    const maxY = 0;
    const minY = -(window.innerHeight - 100);
    const nx = Math.min(maxX, Math.max(minX, dragRef.current.origX + dx));
    const ny = Math.min(maxY, Math.max(minY, dragRef.current.origY + dy));
    setPos({ x: nx, y: ny });
  }, []);

  const onDragPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    dragRef.current = null;
    setIsDragging(false);
    try { localStorage.setItem("hub_assistant_position", JSON.stringify(pos)); } catch { /* ignore */ }
  }, [pos]);


  // Auto-open with a pre-generated assistant message (used by onboarding demo flow)
  useEffect(() => {
    if (!session) return;
    const check = () => {
      const raw = localStorage.getItem("hub_assistant_pending_message");
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as { content: string };
        if (parsed?.content) {
          setMessages((prev) =>
            prev.some((m) => m.content === parsed.content)
              ? prev
              : [...prev, { role: "assistant", content: parsed.content }]
          );
          setIsOpen(true);
        }
      } catch {
        /* ignore */
      }
      localStorage.removeItem("hub_assistant_pending_message");
    };
    // Run on mount + give the chosen route a tick to mount
    const t = setTimeout(check, 400);
    return () => clearTimeout(t);
  }, [session]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !session?.access_token) return;

      const userMsg: Msg = { role: "user", content: text.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hub-assistant`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || `Erro ${res.status}`;
          toast.error(errMsg);
          setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${errMsg}` }]);
          setIsLoading(false);
          return;
        }

        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("text/event-stream") && res.body) {
          // SSE streaming
          let assistantContent = "";
          setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
          setIsLoading(false);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (line.startsWith(":") || line.trim() === "") continue;
              if (!line.startsWith("data: ")) continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;

              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  assistantContent += delta;
                  setMessages((prev) => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                    return copy;
                  });
                }
              } catch {
                // partial JSON, wait for more
              }
            }
          }

          // Check for CRUD toast
          if (assistantContent.includes("✅")) {
            toast.success("Ação executada com sucesso!");
          }
        } else {
          // JSON fallback
          const data = await res.json();
          const content = data.content || data.error || "Sem resposta";
          setMessages((prev) => [...prev, { role: "assistant", content }]);
          setIsLoading(false);
          if (content.includes("✅")) toast.success("Ação executada com sucesso!");
        }
      } catch (err) {
        console.error("Chat error:", err);
        toast.error("Erro ao enviar mensagem");
        setMessages((prev) => [...prev, { role: "assistant", content: "❌ Erro de conexão. Tente novamente." }]);
        setIsLoading(false);
      }
    },
    [messages, session]
  );

  // Auto-send voice input after recognition completes
  useEffect(() => {
    if (pendingVoiceRef.current && !isListening) {
      const text = pendingVoiceRef.current;
      pendingVoiceRef.current = null;
      sendMessage(text);
    }
  }, [isListening, sendMessage]);

  if (!session) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-glow-strong hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center overflow-hidden ring-2 ring-primary/30"
          aria-label="Abrir assistente"
        >
          <img src={hubLogo} alt="Assistente Focus" className="h-16 w-16 object-cover" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "z-50 flex flex-col bg-background border shadow-xl overflow-hidden",
            isMobile
              ? "fixed inset-0"
              : "fixed bottom-24 right-6 w-[400px] h-[500px] rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <img src={hubLogo} alt="Assistente Focus" className="h-8 w-8 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">Assistente Focus</p>
                <p className="text-xs text-muted-foreground">IA do seu negócio</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Olá! Sou o assistente do Focus Hub. Como posso ajudar?
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} />
            ))}

            {isLoading && <ChatMessage role="assistant" content="" isLoading />}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            {isListening && transcript && (
              <p className="text-xs text-muted-foreground mb-2 animate-pulse truncate">
                🎙️ {transcript}...
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={isListening ? transcript : input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Ouvindo..." : "Digite sua mensagem..."}
                disabled={isLoading || isListening}
                className="flex-1 text-sm"
              />
              {micSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  className={cn(isListening && "animate-pulse")}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
