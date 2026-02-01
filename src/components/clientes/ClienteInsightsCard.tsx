import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, Phone, RefreshCw, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Cliente {
  id: string;
  nome: string;
  classificacao?: string | null;
  prioridade_contato?: string | null;
  proxima_acao_sugerida?: string | null;
  ultima_interacao?: string | null;
  status: string;
}

interface ClienteInsightsCardProps {
  clientes: Cliente[];
  onAnalyzeAll: () => Promise<void>;
  isAnalyzing: boolean;
  onOpenSugestoes: () => void;
}

export function ClienteInsightsCard({
  clientes,
  onAnalyzeAll,
  isAnalyzing,
  onOpenSugestoes,
}: ClienteInsightsCardProps) {
  // Calculate insights
  const clientesEmRisco = clientes.filter((c) => c.classificacao === "em_risco").length;
  const prospectosQuentes = clientes.filter(
    (c) => c.status === "prospecto" && c.prioridade_contato === "alta"
  ).length;
  const clientesPrioridadeAlta = clientes.filter(
    (c) => c.prioridade_contato === "alta" && c.status === "ativo"
  ).length;
  const clientesSemAnalise = clientes.filter((c) => !c.classificacao).length;

  const hasInsights = clientesEmRisco > 0 || prospectosQuentes > 0 || clientesPrioridadeAlta > 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Insights Inteligentes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyzeAll}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Analisar Todos
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientesSemAnalise > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Sparkles className="w-4 h-4" />
            <span>
              {clientesSemAnalise} cliente(s) ainda não foram analisados pela IA
            </span>
          </div>
        )}

        {hasInsights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {clientesEmRisco > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{clientesEmRisco}</p>
                  <p className="text-xs text-muted-foreground">Em risco</p>
                </div>
              </div>
            )}

            {prospectosQuentes > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="p-2 rounded-full bg-success/10">
                  <Phone className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{prospectosQuentes}</p>
                  <p className="text-xs text-muted-foreground">Prospectos quentes</p>
                </div>
              </div>
            )}

            {clientesPrioridadeAlta > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{clientesPrioridadeAlta}</p>
                  <p className="text-xs text-muted-foreground">Precisam atenção</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Clique em "Analisar Todos" para gerar insights</p>
          </div>
        )}

        {hasInsights && (
          <Button
            variant="ghost"
            className="w-full justify-between text-primary hover:text-primary hover:bg-primary/5"
            onClick={onOpenSugestoes}
          >
            Ver Sugestões de Ações
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
