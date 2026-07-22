import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Chrome, Slack, Mail, Sparkles, ArrowUpRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * IntegrationsPulse
 * -----------------
 * Widget do Dashboard que prova que as integrações estão VIVAS —
 * não decorativas, escondidas em Settings. Puxa sinais reais:
 * • agenda_items com origin google → última sincronização Google Agenda
 * • audit_log com action='slack_notify' → últimas notificações Slack
 * • clientes com analisado_em recente → últimos enriquecimentos IA
 * • relatorios_enviados via gmail → e-mails via Gmail hoje
 *
 * Cada linha é clicável e leva ao módulo relacionado.
 */

interface PulseSignal {
  icon: typeof Chrome;
  label: string;
  meta: string;
  color: string;
  href: string;
  when?: string;
}

export function IntegrationsPulse() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [signals, setSignals] = useState<PulseSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      // Demo mode: sinais sintéticos, sem tocar Supabase
      const { isDemoMode, demoIntegrationsPulse } = await import("@/lib/demo-fixtures");
      if (isDemoMode()) {
        const iconMap: Record<string, typeof Chrome> = { google: Chrome, slack: Slack, sparkles: Sparkles, mail: Mail };
        setSignals(demoIntegrationsPulse.map((s: any) => ({ ...s, icon: iconMap[s.icon] || Chrome })));
        setGoogleConnected(true);
        setLoading(false);
        return;
      }
      if (!session?.user?.id) return;
      const userId = session.user.id;

      const results: PulseSignal[] = [];

      // 1. Google Agenda — buscar user_integrations + último agenda_items sync
      try {
        const { data: integ } = await supabase
          .from("user_integrations")
          .select("provider, created_at")
          .eq("user_id", userId)
          .eq("provider", "google")
          .maybeSingle();

        setGoogleConnected(!!integ);

        if (integ) {
          const { data: recentEvents } = await supabase
            .from("agenda_items")
            .select("date, title, created_at")
            .eq("user_id", userId)
            .gte("date", new Date().toISOString().split("T")[0])
            .order("date", { ascending: true })
            .limit(3);

          const count = recentEvents?.length || 0;
          results.push({
            icon: Chrome,
            label: count > 0 ? `${count} evento(s) no Google Agenda` : "Google Agenda conectado",
            meta: count > 0 ? `Próximo: ${recentEvents![0].title}` : "Nenhum evento futuro",
            color: "text-primary",
            href: "/atividades",
          });
        }
      } catch (e) {
        console.warn("IntegrationsPulse google:", e);
      }

      // 2. Slack — audit_log com action contendo 'slack'
      try {
        const { data: slackLog } = await supabase
          .from("audit_log")
          .select("action, module, created_at, details")
          .eq("user_id", userId)
          .ilike("action", "%slack%")
          .order("created_at", { ascending: false })
          .limit(1);

        if (slackLog && slackLog.length > 0) {
          const when = formatDistanceToNow(new Date(slackLog[0].created_at), {
            addSuffix: true,
            locale: ptBR,
          });
          results.push({
            icon: Slack,
            label: "Slack ativo",
            meta: `Última notificação ${when}`,
            color: "text-[#E01E5A]",
            href: "/atividades",
            when,
          });
        }
      } catch (e) {
        console.warn("IntegrationsPulse slack:", e);
      }

      // 3. Firecrawl — clientes enriquecidos (analisado_em nos últimos 7 dias)
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { count: enrichedCount } = await supabase
          .from("clientes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("analisado_em", sevenDaysAgo);

        if ((enrichedCount ?? 0) > 0) {
          results.push({
            icon: Sparkles,
            label: `${enrichedCount} cliente(s) enriquecido(s) por IA`,
            meta: "Últimos 7 dias — Firecrawl + Lovable AI",
            color: "text-primary-glow",
            href: "/clientes",
          });
        }
      } catch (e) {
        console.warn("IntegrationsPulse firecrawl:", e);
      }

      // 4. Gmail/Resend — relatórios enviados hoje
      try {
        const today = new Date().toISOString().split("T")[0];
        const { count: emailCount } = await supabase
          .from("relatorios_enviados")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", today);

        if ((emailCount ?? 0) > 0) {
          results.push({
            icon: Mail,
            label: `${emailCount} relatório(s) enviado(s) hoje`,
            meta: "Via e-mail transacional",
            color: "text-warning",
            href: "/atividades",
          });
        }
      } catch (e) {
        console.warn("IntegrationsPulse email:", e);
      }

      setSignals(results);
      setLoading(false);
    })();
  }, [session?.user?.id]);

  // Não mostra o widget se não há nenhum sinal (evita "vazio" incômodo em conta novinha)
  if (loading) {
    return (
      <Card className="p-5 border-border/60 bg-card/80 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Integrações ativas</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (signals.length === 0) {
    return (
      <Card className="p-5 border-dashed border-primary/30 bg-primary/[0.03]">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Integrações</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Conecte Google Agenda, Slack e Firecrawl para automatizar seu dia.
        </p>
        <button
          onClick={() => navigate("/atividades")}
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Configurar integrações
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-border/60 bg-card/80 backdrop-blur shadow-elegant">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="w-4 h-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Integrações ativas</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Ao vivo
        </span>
      </div>

      <div className="space-y-1.5">
        {signals.map((sig, idx) => {
          const Icon = sig.icon;
          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              onClick={() => navigate(sig.href)}
              className="group w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-primary/[0.06] transition-colors text-left"
            >
              <div className={`mt-0.5 shrink-0 ${sig.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{sig.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{sig.meta}</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}
