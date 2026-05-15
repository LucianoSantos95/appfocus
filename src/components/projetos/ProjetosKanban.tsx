import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, DollarSign, Users } from "lucide-react";

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

const COLUMNS: { key: string; label: string; tone: string }[] = [
  { key: "nao_iniciado", label: "Não iniciado", tone: "border-muted-foreground/30" },
  { key: "em_andamento", label: "Em andamento", tone: "border-primary/40" },
  { key: "pausado", label: "Pausado", tone: "border-warning/40" },
  { key: "concluido", label: "Concluído", tone: "border-success/40" },
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
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

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
              <h4 className="text-sm font-semibold text-foreground">{col.label}</h4>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragId(p.id)}
                  onClick={() => onCardClick(p.id)}
                  className="bg-card rounded-lg border border-border/50 p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors shadow-sm"
                >
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
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {p.responsible && (
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.responsible}</span>
                    )}
                    {p.end_date && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.end_date).toLocaleDateString("pt-BR")}</span>
                    )}
                    {p.budget ? (
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{(p.budget / 1000).toFixed(1)}k</span>
                    ) : null}
                  </div>
                </div>
              ))}
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
