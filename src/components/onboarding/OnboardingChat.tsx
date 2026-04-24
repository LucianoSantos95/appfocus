import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { OnboardingSession } from "@/hooks/useOnboardingSession";

const QUICK_REPLIES = [
  "Quero começar pelo mais rápido",
  "Pode me guiar passo a passo",
  "Já tenho alguns dados para lançar",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ApiMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface Props {
  session: OnboardingSession;
  onModuleComplete: (mod: string, metadata?: Record<string, any>) => void;
  onAchievement: (ach: string) => void;
  onInsight?: (payload: { insight: string; emoji?: string; module?: string }) => void;
}

export function OnboardingChat({ session, onModuleComplete, onAchievement, onInsight }: Props) {
  const { session: authSession } = useAuth();
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

  const createRecordFromTool = useCallback(async (module: string, data: Record<string, any>) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) throw new Error("Usuário não autenticado");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split("T")[0];

    switch (module) {
      case "tarefas": {
        const payload = {
          title: data.nome || data.title || "Nova tarefa",
          description: data.descricao || data.description || null,
          due_date: data.vencimento === "amanhã" || data.vencimento === "amanha" || data.data_vencimento === "amanhã" || data.data_vencimento === "amanha"
            ? tomorrowIso
            : (data.due_date || data.vencimento || data.data_vencimento || null),
          priority: data.prioridade || data.priority || "media",
          status: data.status || "pendente",
          user_id: user.id,
        };
        const { data: created, error } = await supabase.from("tarefas").insert(payload as never).select().single();
        if (error) throw error;
        return created;
      }
      case "clientes": {
        const payload = {
          nome: data.nome || data.name || "Novo cliente",
          email: data.email || null,
          telefone: data.telefone || data.phone || null,
          segmento: data.segmento || null,
          status: data.status || "prospecto",
          valor_total: Number(data.valor_total || data.value || 0),
          tipo_contrato: data.tipo_contrato || null,
          anexo_url: null,
          empresa: data.empresa || data.nome || data.name || "Novo cliente",
          ultima_interacao: new Date().toISOString().split("T")[0],
          user_id: user.id,
        };
        const { data: created, error } = await supabase.from("clientes").insert(payload as never).select().single();
        if (error) throw error;
        return created;
      }
      case "transacoes": {
        const payload = {
          description: data.descricao || data.description || "Nova transação",
          value: Number(data.valor || data.value || 0),
          date: data.date || new Date().toISOString().split("T")[0],
          category: data.categoria || data.category || null,
          type: data.tipo || data.type || "receita",
          status: data.status || "pendente",
          payment_method: data.payment_method || null,
          client: data.cliente || data.client || null,
          provider: data.provider || null,
          notes: data.notes || null,
          bank_account_id: null,
          user_id: user.id,
        };
        const { data: created, error } = await supabase.from("transacoes").insert(payload as never).select().single();
        if (error) throw error;
        return created;
      }
      case "projetos": {
        const payload = {
          name: data.nome || data.name || "Novo projeto",
          status: data.status || "planejamento",
          priority: data.prioridade || data.priority || "media",
          start_date: data.start_date || new Date().toISOString().split("T")[0],
          end_date: data.end_date || data.prazo || null,
          budget: data.orcamento ? Number(data.orcamento) : null,
          responsible: data.responsavel || data.responsible || null,
          description: data.descricao || data.description || null,
          user_id: user.id,
        };
        const { data: created, error } = await supabase.from("projetos").insert(payload as never).select().single();
        if (error) throw error;
        return created;
      }
      case "processos": {
        const payload = {
          name: data.nome || data.name || "Novo processo",
          description: data.descricao || data.description || null,
          department: data.departamento || data.department || null,
          owner: data.responsavel || data.owner || null,
          status: data.status || "ativo",
          user_id: user.id,
        };
        const { data: created, error } = await supabase.from("processos").insert(payload as never).select().single();
        if (error) throw error;
        return created;
      }
      case "campanhas": {
        const payload = {
          name: data.nome || data.name || "Nova campanha",
          objective: data.objetivo || data.objective || null,
          platforms: data.plataformas || data.platforms || null,
          budget: data.orcamento ? Number(data.orcamento) : null,
          start_date: data.start_date || new Date().toISOString().split("T")[0],
          end_date: data.end_date || null,
          status: data.status || "planejada",
          responsible: data.responsavel || data.responsible || null,
          user_id: user.id,
        };
        const { data: created, error } = await supabase.from("campanhas").insert(payload as never).select().single();
        if (error) throw error;
        return created;
      }
      case "colaboradores": {
        const payload = {
          name: data.nome || data.name || "Novo colaborador",
          role: data.cargo || data.role || null,
          department: data.departamento || data.department || null,
          salary: data.salario ? Number(data.salario) : null,
          start_date: data.start_date || new Date().toISOString().split("T")[0],
          email: data.email || null,
          phone: data.telefone || data.phone || null,
          status: data.status || "ativo",
          manager: data.gestor || data.manager || null,
          user_id: user.id,
        };
        const { data: created, error } = await supabase.from("colaboradores").insert(payload as never).select().single();
        if (error) throw error;
        return created;
      }
      default:
        throw new Error(`Módulo não suportado no onboarding: ${module}`);
    }
  }, []);

  const streamChat = useCallback(async (msgs: ApiMessage[], depth = 0) => {
    setIsLoading(true);
    let assistantSoFar = "";
    const toolCallAccumulator: Record<number, { id?: string; name: string; arguments: string }> = {};

    try {
      const token = authSession?.access_token;
      const chatUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-assistant`;
      
      const resp = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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

          let parsed: any;
          try {
            parsed = JSON.parse(jsonStr);
          } catch (err) {
            console.warn("Skipping malformed SSE chunk:", jsonStr.slice(0, 120));
            continue;
          }

          const delta = parsed.choices?.[0]?.delta;
          const finishReason = parsed.choices?.[0]?.finish_reason;

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

          // Accumulate tool call chunks
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallAccumulator[idx]) {
                toolCallAccumulator[idx] = { name: "", arguments: "" };
              }
               if (tc.id) {
                 toolCallAccumulator[idx].id = tc.id;
               }
               if (tc.function?.name) {
                toolCallAccumulator[idx].name = tc.function.name;
              }
              if (tc.function?.arguments) {
                toolCallAccumulator[idx].arguments += tc.function.arguments;
              }
            }
          }

          // Process tool calls when finish_reason indicates they're complete
          if (finishReason === "tool_calls" || finishReason === "stop") {
            const pendingToolMessages: ApiMessage[] = [];
            const completedToolCalls = Object.values(toolCallAccumulator).map((call) => ({
              id: call.id || crypto.randomUUID(),
              type: "function" as const,
              function: {
                name: call.name,
                arguments: call.arguments,
              },
            }));

            for (const [, tc] of Object.entries(toolCallAccumulator)) {
              if (tc.name === "create_record" && tc.arguments) {
                try {
                  const args = JSON.parse(tc.arguments);
                  const created = await createRecordFromTool(args.module, args.data || {});
                  pendingToolMessages.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: JSON.stringify({ ok: true, module: args.module, record: created }),
                  });
                } catch (error) {
                  pendingToolMessages.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Erro ao criar registro" }),
                  });
                }
              }

              if (tc.name === "show_insight" && tc.arguments) {
                try {
                  const args = JSON.parse(tc.arguments);
                  if (args.insight) onInsight?.({
                    insight: args.insight,
                    emoji: args.emoji,
                    module: session.completed_modules?.[session.completed_modules.length] || undefined,
                  });
                  pendingToolMessages.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: JSON.stringify({ ok: true, shown: true, insight: args.insight }),
                  });
                } catch {
                  console.warn("Failed to parse show_insight args:", tc.arguments);
                }
              }

              if (tc.name === "complete_module" && tc.arguments) {
                try {
                  const args = JSON.parse(tc.arguments);
                  if (args.module) {
                    onModuleComplete(args.module, args.data || {});
                    pendingToolMessages.push({
                      role: "tool",
                      tool_call_id: tc.id,
                      content: JSON.stringify({ ok: true, completed: true, module: args.module }),
                    });
                  }
                } catch (e) {
                  console.warn("Failed to parse complete_module args:", tc.arguments);
                }
              }
            }
            // Clear accumulator after processing
            Object.keys(toolCallAccumulator).forEach(k => delete toolCallAccumulator[Number(k)]);

            // If model called a tool but produced no text, prompt a continuation so it doesn't hang
            if (finishReason === "tool_calls" && !assistantSoFar.trim()) {
              assistantSoFar = "✅ Registrado! Vamos continuar.";
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }

            if (finishReason === "tool_calls" && pendingToolMessages.length > 0 && depth < 2) {
              const continuationMessages: ApiMessage[] = [
                ...msgs,
                {
                  role: "assistant",
                  content: assistantSoFar,
                  tool_calls: completedToolCalls,
                },
                ...pendingToolMessages,
              ];

              setIsLoading(false);
              await streamChat(continuationMessages, depth + 1);
              return;
            }
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
  }, [session, onModuleComplete, authSession, onInsight, createRecordFromTool]);

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

  const handleQuickReply = async (reply: string) => {
    if (isLoading) return;
    const userMsg: Message = { role: "user", content: reply };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
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
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply) => (
                <Button
                  key={reply}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full"
                  onClick={() => handleQuickReply(reply)}
                  disabled={isLoading}
                >
                  {reply}
                </Button>
              ))}
            </div>
          )}

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
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="secondary">1 cliente/dado real</Badge>
          <Badge variant="secondary">1 módulo concluído</Badge>
          <Badge variant="secondary">valor percebido em minutos</Badge>
        </div>
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
