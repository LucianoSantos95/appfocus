import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chrome, X, ArrowUpRight } from "lucide-react";

/**
 * ContextualIntegrationsHint
 * Fase 1.5 (leve): cartão contextual que aparece no topo de módulos
 * como Clientes/RH sugerindo conectar Google/Slack no fluxo onde o
 * valor aparece — sem forçar o usuário a caçar em Configurações.
 * Dismissível por sessão (localStorage) para não virar poluição.
 */
interface Props {
  module: "clientes" | "rh" | "projetos";
}

const MSG: Record<Props["module"], { title: string; desc: string; cta: string }> = {
  clientes: {
    title: "Agende reuniões em 1 clique",
    desc: "Conecte o Google Agenda e crie convites direto do card do cliente.",
    cta: "Conectar Google",
  },
  rh: {
    title: "Alertas de férias e aniversários",
    desc: "Conecte o Google Agenda para bloquear datas da equipe automaticamente.",
    cta: "Conectar Google",
  },
  projetos: {
    title: "Deadlines no seu calendário",
    desc: "Conecte o Google e envie prazos de projetos direto à sua agenda.",
    cta: "Conectar Google",
  },
};

export function ContextualIntegrationsHint({ module }: Props) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const dismissKey = `hint_google_${module}_dismissed`;

  useEffect(() => {
    if (!session?.user?.id) return;
    if (localStorage.getItem(dismissKey) === "1") return;

    (async () => {
      const { data } = await supabase
        .from("user_integrations")
        .select("provider")
        .eq("user_id", session.user.id)
        .eq("provider", "google")
        .maybeSingle();
      if (!data) setShow(true);
    })();
  }, [session?.user?.id, dismissKey]);

  if (!show) return null;

  const copy = MSG[module];

  return (
    <Card className="relative flex items-center gap-4 p-3.5 border-primary/25 bg-gradient-to-r from-primary/[0.06] via-primary/[0.03] to-transparent">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
        <Chrome className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">{copy.desc}</p>
      </div>
      <Button
        size="sm"
        onClick={() => navigate("/atividades")}
        className="gap-1"
      >
        {copy.cta}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Button>
      <button
        onClick={() => {
          localStorage.setItem(dismissKey, "1");
          setShow(false);
        }}
        className="p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dispensar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </Card>
  );
}
