import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { OnboardingSession } from "@/hooks/useOnboardingSession";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  session: OnboardingSession;
  onModuleComplete: (mod: string) => void;
  onAchievement: (ach: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-assistant`;

export function OnboardingChat({ session, onModuleComplete, onAchievement }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const streamChat = useCallback(async (msgs: Message[]) => {
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: msgs, session_data: session }),
      });

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;

            // Handle text content
            if (delta?.content) {
              assistantSoFar += delta.content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
              scrollToBottom();
            }

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name === "complete_module") {
                  try {
                    const args = JSON.parse(tc.function.arguments);
                    onModuleComplete(args.module);
                  } catch {}
                }
                if (tc.function?.name === "show_insight") {
                  // Insight is shown inline in the chat
                }
              }
            }

            // Handle finished tool calls in the message
            const finishReason = parsed.choices?.[0]?.finish_reason;
            if (finishReason === "tool_calls") {
              // Process any accumulated tool calls
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Onboarding chat error:", e);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, houve um erro. Tente novamente em instantes. 🔄",
      }]);
    }

    setIsLoading(false);
    scrollToBottom();
  }, [session, onModuleComplete]);

  // Auto-start conversation
  useEffect(() => {
    if (initializedRef.current || !session) return;
    initializedRef.current = true;

    const greeting: Message = {
      role: "user",
      content: session.current_step === "welcome"
        ? "Olá! Acabei de configurar meu perfil. Me ajude a começar!"
        : "Vamos continuar de onde paramos!",
    };
    setMessages([greeting]);
    streamChat([greeting]);
    onAchievement("first_step");
  }, [session, streamChat, onAchievement]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    scrollToBottom();
    await streamChat(newMsgs);
  };

  return (
    <div className="flex flex-col h-full border border-border/50 rounded-xl overflow-hidden bg-card/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-primary/5">
        <Bot className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Assistente Focus</span>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4 max-h-[400px]">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="rounded-full bg-primary/10 p-1.5 h-7 w-7 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`rounded-xl px-4 py-2.5 max-w-[85%] text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="rounded-full bg-muted p-1.5 h-7 w-7 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border/50">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua resposta..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
