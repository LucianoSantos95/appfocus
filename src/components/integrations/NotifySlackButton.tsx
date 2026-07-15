import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface NotifySlackButtonProps {
  title: string;
  text: string;
  level?: "urgent" | "warning" | "success" | "info";
  size?: "sm" | "default";
  variant?: "ghost" | "outline" | "default";
  className?: string;
  label?: string;
}

/**
 * Botão inline para disparar aviso no Slack (canal padrão do usuário).
 * Usa `hub:slack_channel` (localStorage) ou `user_preferences.slack_default_channel`.
 * Se nada estiver configurado, mostra CTA para abrir Configurações → Integrações.
 */
export function NotifySlackButton({
  title,
  text,
  level = "urgent",
  size = "sm",
  variant = "ghost",
  className,
  label = "Avisar equipe no Slack",
}: NotifySlackButtonProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);

  const resolveChannel = async (): Promise<string | null> => {
    const local = typeof window !== "undefined" ? localStorage.getItem("hub:slack_channel") : null;
    if (local && local.trim()) return local.trim();
    if (!session?.user?.id) return null;
    const { data } = await supabase
      .from("user_preferences" as any)
      .select("slack_default_channel")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const ch = (data as any)?.slack_default_channel as string | null | undefined;
    return ch?.trim() || null;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.access_token) return;
    setSending(true);
    try {
      const channel = await resolveChannel();
      if (!channel) {
        toast({
          title: "Canal do Slack não configurado",
          description: "Defina o canal padrão em Configurações → Integrações.",
          action: (
            <Button size="sm" variant="outline" onClick={() => navigate("/?settings=integrations")}>
              Configurar
            </Button>
          ) as any,
          variant: "destructive",
        });
        return;
      }
      const { data, error } = await supabase.functions.invoke("notify-slack", {
        body: { channel, title, text, level },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Slack notificado 📣", description: `Canal ${channel}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao notificar Slack";
      toast({ title: "Erro no Slack", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={sending}
      className={className}
    >
      {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
      {label}
    </Button>
  );
}
