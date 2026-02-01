import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Phone, Mail, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sugestao {
  id: string;
  clienteId: string;
  clienteNome: string;
  acao: string;
  prioridade: string;
  classificacao?: string | null;
}

interface SugestoesPainelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugestoes: Sugestao[];
}

const prioridadeConfig = {
  alta: {
    label: "Alta",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  media: {
    label: "Média",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  baixa: {
    label: "Baixa",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function SugestoesPainel({
  open,
  onOpenChange,
  sugestoes,
}: SugestoesPainelProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const toggleCompleted = (id: string) => {
    const newSet = new Set(completedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCompletedIds(newSet);
  };

  const pendingSugestoes = sugestoes.filter((s) => !completedIds.has(s.id));
  const completedSugestoes = sugestoes.filter((s) => completedIds.has(s.id));

  // Sort by priority
  const sortByPriority = (a: Sugestao, b: Sugestao) => {
    const order = { alta: 0, media: 1, baixa: 2 };
    return (order[a.prioridade as keyof typeof order] ?? 2) - (order[b.prioridade as keyof typeof order] ?? 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Sugestões da IA
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {sugestoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma sugestão disponível</p>
              <p className="text-sm mt-2">
                Analise os clientes para gerar sugestões
              </p>
            </div>
          ) : (
            <>
              {/* Pending suggestions */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Pendentes ({pendingSugestoes.length})
                </h3>
                {pendingSugestoes.sort(sortByPriority).map((sugestao) => (
                  <SugestaoItem
                    key={sugestao.id}
                    sugestao={sugestao}
                    completed={false}
                    onToggle={() => toggleCompleted(sugestao.id)}
                  />
                ))}
              </div>

              {/* Completed suggestions */}
              {completedSugestoes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Concluídas ({completedSugestoes.length})
                  </h3>
                  {completedSugestoes.map((sugestao) => (
                    <SugestaoItem
                      key={sugestao.id}
                      sugestao={sugestao}
                      completed={true}
                      onToggle={() => toggleCompleted(sugestao.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SugestaoItem({
  sugestao,
  completed,
  onToggle,
}: {
  sugestao: Sugestao;
  completed: boolean;
  onToggle: () => void;
}) {
  const prioridade = prioridadeConfig[sugestao.prioridade as keyof typeof prioridadeConfig] || prioridadeConfig.baixa;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        completed
          ? "bg-muted/30 border-border/50"
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "font-medium text-foreground",
                completed && "line-through text-muted-foreground"
              )}
            >
              {sugestao.clienteNome}
            </span>
            <Badge variant="outline" className={cn("text-xs", prioridade.className)}>
              {prioridade.label}
            </Badge>
          </div>
          <p
            className={cn(
              "text-sm text-muted-foreground",
              completed && "line-through"
            )}
          >
            {sugestao.acao}
          </p>
        </div>
        {completed && (
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
