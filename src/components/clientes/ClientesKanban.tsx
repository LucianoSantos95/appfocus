import { useState } from "react";
import { cn } from "@/lib/utils";
import { Mail, Phone, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { ClienteAIBadge } from "./ClienteAIBadge";
import { ScheduleGoogleDialog } from "./ScheduleGoogleDialog";
import { Button } from "@/components/ui/button";

interface KanbanCliente {
  id: string;
  nome: string;
  status: string;
  email?: string | null;
  telefone?: string | null;
  segmento?: string | null;
  valor_total?: number | null;
  classificacao?: string | null;
}

const COLUMNS: { key: string; label: string; tone: string; accent: string }[] = [
  { key: "prospecto", label: "Prospectos", tone: "border-primary/40", accent: "bg-primary/5" },
  { key: "ativo", label: "Ativos", tone: "border-success/40", accent: "bg-success/5" },
  { key: "inativo", label: "Inativos", tone: "border-muted-foreground/30", accent: "bg-muted/10" },
];

interface Props {
  clientes: KanbanCliente[];
  onStatusChange: (id: string, status: string) => void;
  onCardClick: (id: string) => void;
}

export function ClientesKanban({ clientes, onStatusChange, onCardClick }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<KanbanCliente | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const items = clientes.filter(c => (c.status || "prospecto") === col.key);
          const total = items.reduce((s, c) => s + (c.valor_total || 0), 0);
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
                "rounded-xl border-2 border-dashed p-3 min-h-[400px] transition-colors",
                col.accent,
                col.tone,
                overCol === col.key && "bg-primary/10 border-primary/60"
              )}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h4 className="font-display text-lg text-foreground italic">{col.label}</h4>
                  {total > 0 && (
                    <p className="text-[11px] text-muted-foreground font-numeric">R$ {total.toLocaleString("pt-BR")}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-numeric">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(c => {
                  const isHot = c.classificacao === "quente" || c.classificacao === "hot";
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      className={cn(
                        "group bg-card rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all shadow-sm",
                        "hover:border-primary/40 hover:shadow-glow hover:-translate-y-0.5",
                        isHot && "border-primary/60 shadow-glow"
                      )}
                    >
                      <div
                        onClick={() => onCardClick(c.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 font-display",
                              isHot ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                            )}>
                              {c.nome.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                          </div>
                          <ClienteAIBadge classificacao={c.classificacao || null} />
                        </div>
                        {c.segmento && (
                          <p className="text-[11px] text-muted-foreground mb-2">{c.segmento}</p>
                        )}
                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                          {c.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" />{c.email}</span>}
                          {c.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefone}</span>}
                          {(c.valor_total || 0) > 0 && (
                            <span className="flex items-center gap-1 text-foreground font-medium font-numeric">
                              <DollarSign className="w-3 h-3" />R$ {(c.valor_total || 0).toLocaleString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Ação inline: Agendar reunião no Google */}
                      <div className="mt-2 pt-2 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScheduleTarget(c);
                          }}
                        >
                          <CalendarIcon className="w-3 h-3" />
                          Agendar reunião
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Arraste clientes para cá</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {scheduleTarget && (
        <ScheduleGoogleDialog
          open={!!scheduleTarget}
          onOpenChange={(o) => !o && setScheduleTarget(null)}
          clienteNome={scheduleTarget.nome}
          clienteEmail={scheduleTarget.email}
        />
      )}
    </>
  );
}

