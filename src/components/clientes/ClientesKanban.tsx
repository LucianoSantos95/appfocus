import { useState } from "react";
import { cn } from "@/lib/utils";
import { Mail, Phone, DollarSign } from "lucide-react";
import { ClienteAIBadge } from "./ClienteAIBadge";

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

const COLUMNS: { key: string; label: string; tone: string }[] = [
  { key: "prospecto", label: "Prospectos", tone: "border-primary/40" },
  { key: "ativo", label: "Ativos", tone: "border-success/40" },
  { key: "inativo", label: "Inativos", tone: "border-muted-foreground/30" },
];

interface Props {
  clientes: KanbanCliente[];
  onStatusChange: (id: string, status: string) => void;
  onCardClick: (id: string) => void;
}

export function ClientesKanban({ clientes, onStatusChange, onCardClick }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  return (
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
              "rounded-xl border-2 border-dashed p-3 bg-muted/20 min-h-[400px] transition-colors",
              col.tone,
              overCol === col.key && "bg-primary/5 border-primary/60"
            )}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{col.label}</h4>
                {total > 0 && (
                  <p className="text-[11px] text-muted-foreground">R$ {total.toLocaleString("pt-BR")}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(c => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onClick={() => onCardClick(c.id)}
                  className="bg-card rounded-lg border border-border/50 p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                        {c.nome.charAt(0)}
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
                      <span className="flex items-center gap-1 text-foreground font-medium"><DollarSign className="w-3 h-3" />R$ {(c.valor_total || 0).toLocaleString("pt-BR")}</span>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Arraste clientes para cá</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
