import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, DollarSign, Users, CalendarPlus, Loader2, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface KanbanProjeto {
  id: string;
  name: string;
  status: string;
  priority?: string | null;
  responsible?: string | null;
  end_date?: string | null;
  budget?: number | null;
  cliente_nome?: string | null;
}

const COLUMNS: { key: string; label: string; tone: string; accent: string; progress: number }[] = [
  { key: "nao_iniciado", label: "Não iniciado", tone: "border-muted-foreground/30", accent: "bg-muted-foreground/40", progress: 5 },
  { key: "em_andamento", label: "Em andamento", tone: "border-primary/40", accent: "bg-primary", progress: 55 },
  { key: "pausado", label: "Pausado", tone: "border-warning/40", accent: "bg-warning", progress: 40 },
  { key: "concluido", label: "Concluído", tone: "border-success/40", accent: "bg-success", progress: 100 },
];

const priorityStyles: Record<string, string> = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-warning/10 text-warning",
  baixa: "bg-success/10 text-success",
};

interface Props {
  projetos: KanbanProjeto[];
  onStatusChange: (id: string, status: string) => void;
  onCardClick: (id: string) => void;
}

export function ProjetosKanban({ projetos, onStatusChange, onCardClick }: Props) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [pushingId, setPushingId] = useState<string | null>(null);

  const pushDeadlineToGoogle = async (p: KanbanProjeto) => {
    if (!session?.access_token || !p.end_date) return;
    setPushingId(p.id);
    try {
      const startISO = new Date(`${p.end_date}T09:00:00`).toISOString();
      const endISO = new Date(new Date(startISO).getTime() + 60 * 60000).toISOString();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-integration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: "create_event",
          summary: `Deadline: ${p.name}`,
          description: `Prazo final do projeto${p.cliente_nome ? ` para ${p.cliente_nome}` : ""}.`,
          start: startISO,
          end: endISO,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error || "Falha ao criar evento";
        if (msg.toLowerCase().includes("google") || msg.toLowerCase().includes("token") || msg.toLowerCase().includes("connect")) {
          toast({
            title: "Google Agenda não conectado",
            description: "Conecte em Configurações → Integrações para agendar deadlines automaticamente.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Erro", description: msg, variant: "destructive" });
        }
        return;
      }
      toast({ title: "Deadline no Google 📅", description: `${p.name} — ${new Date(p.end_date).toLocaleDateString("pt-BR")}` });
    } catch (e) {
      toast({ title: "Erro ao sincronizar", variant: "destructive" });
    } finally {
      setPushingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const items = projetos.filter(p => (p.status || "nao_iniciado") === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
            onDragLeave={() => setOverCol(null)}
            onDrop={() => {
              if (dragId) onStatusChange(dragId, col.key);
              setDragId(null);
              setOverCol(null);
            }}
            className={cn(
              "rounded-xl border-2 border-dashed p-3 bg-muted/20 min-h-[300px] transition-colors",
              col.tone,
              overCol === col.key && "bg-primary/5 border-primary/60"
            )}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="font-display text-lg text-foreground italic">{col.label}</h4>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-numeric">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(p => {
                const overdue = p.end_date && col.key !== "concluido" && new Date(p.end_date) < new Date();
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    className={cn(
                      "group bg-card rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all shadow-sm",
                      "hover:border-primary/40 hover:shadow-glow hover:-translate-y-0.5",
                      overdue && "border-destructive/50"
                    )}
                  >
                    <div onClick={() => onCardClick(p.id)} className="cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{p.name}</p>
                        {p.priority && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize shrink-0", priorityStyles[p.priority] || "")}>
                            {p.priority}
                          </span>
                        )}
                      </div>
                      {p.cliente_nome && (
                        <p className="text-xs text-primary mb-2 truncate">{p.cliente_nome}</p>
                      )}
                      {/* Progress bar por status (personalidade "Projetos") */}
                      <div className="mb-2">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full transition-all duration-500 rounded-full", col.accent)}
                            style={{ width: `${col.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        {p.responsible && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.responsible}</span>
                        )}
                        {p.end_date && (
                          <span className={cn("flex items-center gap-1 font-numeric", overdue && "text-destructive font-semibold")}>
                            <Calendar className="w-3 h-3" />{new Date(p.end_date).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {p.budget ? (
                          <span className="flex items-center gap-1 font-numeric"><DollarSign className="w-3 h-3" />{(p.budget / 1000).toFixed(1)}k</span>
                        ) : null}
                      </div>
                    </div>

                    {p.end_date && col.key !== "concluido" && (
                      <div className="mt-2 pt-2 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); pushDeadlineToGoogle(p); }}
                          disabled={pushingId === p.id}
                          className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          {pushingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />}
                          Deadline no Google
                          <Chrome className="w-3 h-3 opacity-60" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Arraste projetos para cá</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
