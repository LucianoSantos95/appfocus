import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chrome, X, ArrowUpRight, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * ContextualIntegrationsHint
 * Mostra hint contextual da integração mais útil para o módulo atual
 * (Google Agenda, Slack ou WhatsApp), pulando as já conectadas e as
 * dispensadas. Dismiss por (módulo + provider) via localStorage.
 */
type Provider = "google" | "slack" | "whatsapp";
type Module = "clientes" | "rh" | "projetos" | "tarefas";

interface Props {
  module: Module;
}

const PROVIDER_PRIORITY: Record<Module, Provider[]> = {
  clientes: ["google", "whatsapp", "slack"],
  projetos: ["slack", "google", "whatsapp"],
  rh: ["google", "whatsapp", "slack"],
  tarefas: ["slack", "whatsapp", "google"],
};

const COPY: Record<Module, Record<Provider, { title: string; desc: string; cta: string }>> = {
  clientes: {
    google: { title: "Agende reuniões em 1 clique", desc: "Conecte o Google Agenda e crie convites direto do card do cliente.", cta: "Conectar Google" },
    whatsapp: { title: "Fale com clientes pelo WhatsApp", desc: "Configure seu número e envie mensagens direto do CRM.", cta: "Configurar WhatsApp" },
    slack: { title: "Avise o time no Slack", desc: "Notifique automaticamente novos clientes e mudanças de status.", cta: "Conectar Slack" },
  },
  projetos: {
    slack: { title: "Kanban conectado ao Slack", desc: "Notifique responsáveis quando tarefas mudarem de coluna.", cta: "Conectar Slack" },
    google: { title: "Deadlines no seu calendário", desc: "Conecte o Google e envie prazos de projetos direto à sua agenda.", cta: "Conectar Google" },
    whatsapp: { title: "Lembretes por WhatsApp", desc: "Receba alertas de prazos e entregas no seu WhatsApp.", cta: "Configurar WhatsApp" },
  },
  rh: {
    google: { title: "Alertas de férias e aniversários", desc: "Conecte o Google Agenda para bloquear datas da equipe automaticamente.", cta: "Conectar Google" },
    whatsapp: { title: "Comunicados por WhatsApp", desc: "Envie avisos e lembretes de RH direto para a equipe.", cta: "Configurar WhatsApp" },
    slack: { title: "Canal do time no Slack", desc: "Notifique novas contratações e eventos internos automaticamente.", cta: "Conectar Slack" },
  },
  tarefas: {
    slack: { title: "Notifique o responsável no Slack", desc: "Cada tarefa criada dispara aviso no canal do time.", cta: "Conectar Slack" },
    whatsapp: { title: "Lembretes de tarefas no WhatsApp", desc: "Receba pings antes do vencimento das suas atividades.", cta: "Configurar WhatsApp" },
    google: { title: "Tarefas na agenda", desc: "Sincronize prazos com o Google Agenda.", cta: "Conectar Google" },
  },
};

const ICON: Record<Provider, React.ComponentType<{ className?: string }>> = {
  google: Chrome,
  slack: MessageSquare,
  whatsapp: Send,
};

export function ContextualIntegrationsHint({ module }: Props) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connected, setConnected] = useState<Set<Provider> | null>(null);
  const [dismissTick, setDismissTick] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    (async () => {
      const uid = session.user.id;
      const [intRes, waRes] = await Promise.all([
        supabase.from("user_integrations").select("provider").eq("user_id", uid),
        supabase.from("whatsapp_preferences" as any).select("whatsapp_number").eq("user_id", uid).maybeSingle(),
      ]);
      if (cancelled) return;
      const set = new Set<Provider>();
      (intRes.data || []).forEach((r: any) => {
        if (r.provider === "google") set.add("google");
        if (r.provider === "slack") set.add("slack");
      });
      const waNum = (waRes.data as any)?.whatsapp_number;
      if (waNum && String(waNum).trim().length > 0) set.add("whatsapp");
      setConnected(set);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const active = useMemo<Provider | null>(() => {
    if (!connected) return null;
    for (const p of PROVIDER_PRIORITY[module]) {
      if (connected.has(p)) continue;
      if (localStorage.getItem(`hint_${p}_${module}_dismissed`) === "1") continue;
      return p;
    }
    return null;
  }, [connected, module, dismissTick]);

  if (!active) return null;

  const copy = COPY[module][active];
  const Icon = ICON[active];

  const handleCta = () => {
    if (active === "google") {
      navigate("/atividades");
      return;
    }
    toast({
      title: active === "slack" ? "Conectar Slack" : "Configurar WhatsApp",
      description: "Abra o menu do usuário (canto superior) → Perfil para concluir a configuração.",
    });
  };

  const handleDismiss = () => {
    localStorage.setItem(`hint_${active}_${module}_dismissed`, "1");
    setDismissTick((t) => t + 1);
  };

  return (
    <Card className="relative flex items-center gap-4 p-3.5 border-primary/25 bg-gradient-to-r from-primary/[0.06] via-primary/[0.03] to-transparent">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">{copy.desc}</p>
      </div>
      <Button size="sm" onClick={handleCta} className="gap-1">
        {copy.cta}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Button>
      <button
        onClick={handleDismiss}
        className="p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dispensar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </Card>
  );
}
