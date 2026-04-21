import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { useImportHistory } from "@/hooks/useImportHistory";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportHistoryDialogProps {
  module?: string;
  trigger?: React.ReactNode;
}

export function ImportHistoryDialog({ module, trigger }: ImportHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const { history, isLoading, deleteEntry } = useImportHistory(module);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <History className="w-4 h-4" />
            Histórico
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <History className="w-5 h-5 text-primary" />
            Histórico de Importações
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma importação registrada ainda.</p>
              <p className="text-xs mt-1">
                Quando você importar uma planilha, ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const hasErrors = entry.error_records > 0;
                const date = new Date(entry.created_at);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {hasErrors ? (
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.file_name || "Importação sem nome"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {entry.module}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {date.toLocaleDateString("pt-BR")}{" "}
                            {date.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-xs text-success">
                            ✓ {entry.imported_records} importados
                          </span>
                          {hasErrors && (
                            <span className="text-xs text-warning">
                              ⚠ {entry.error_records} erros
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            de {entry.total_records} total
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
