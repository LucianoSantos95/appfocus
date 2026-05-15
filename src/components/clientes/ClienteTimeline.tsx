import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, FolderKanban, DollarSign, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  date: string;
  type: "recording" | "projeto" | "transacao" | "nota";
  title: string;
  description?: string;
  meta?: string;
}

interface Props {
  clienteId: string;
  clienteNome: string;
}

const ICONS = {
  recording: Mic,
  projeto: FolderKanban,
  transacao: DollarSign,
  nota: FileText,
};

const COLORS = {
  recording: "text-primary bg-primary/10",
  projeto: "text-warning bg-warning/10",
  transacao: "text-success bg-success/10",
  nota: "text-muted-foreground bg-muted",
};

export function ClienteTimeline({ clienteId, clienteNome }: Props) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [recRes, projRes, txRes] = await Promise.all([
        sb.from("client_recordings").select("id, created_at, duration_sec, summary, status").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
        sb.from("projetos").select("id, name, status, start_date, end_date, budget, created_at").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
        sb.from("transacoes").select("id, description, value, type, status, date").eq("client", clienteNome).order("date", { ascending: false }).limit(50),
      ]);

      const list: TimelineEvent[] = [];
      (recRes.data || []).forEach((r: any) => list.push({
        id: `r-${r.id}`,
        date: r.created_at,
        type: "recording",
        title: "Reunião gravada",
        description: r.summary || (r.status === "pendente" ? "Transcrevendo…" : undefined),
        meta: r.duration_sec ? `${Math.round(r.duration_sec / 60)} min` : undefined,
      }));
      (projRes.data || []).forEach((p: any) => list.push({
        id: `p-${p.id}`,
        date: p.created_at,
        type: "projeto",
        title: p.name,
        description: `Projeto • ${p.status}`,
        meta: p.budget ? `R$ ${Number(p.budget).toLocaleString("pt-BR")}` : undefined,
      }));
      (txRes.data || []).forEach((t: any) => list.push({
        id: `t-${t.id}`,
        date: t.date,
        type: "transacao",
        title: t.description,
        description: `${t.type === "receita" ? "Receita" : "Despesa"} • ${t.status}`,
        meta: `R$ ${Number(t.value).toLocaleString("pt-BR")}`,
      }));

      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (!cancelled) {
        setEvents(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clienteId, clienteNome]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    events.forEach(e => {
      const key = new Date(e.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        Nenhum evento ainda. Reuniões, projetos e transações vinculadas aparecerão aqui.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([month, items]) => (
        <div key={month}>
          <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3 capitalize">{month}</h4>
          <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-border">
            {items.map(e => {
              const Icon = ICONS[e.type];
              return (
                <div key={e.id} className="relative">
                  <div className={cn("absolute -left-[18px] top-1 w-5 h-5 rounded-full flex items-center justify-center", COLORS[e.type])}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(e.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {e.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                    )}
                    {e.meta && (
                      <span className="inline-block mt-2 text-[11px] bg-background border border-border px-2 py-0.5 rounded-full text-foreground">{e.meta}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
