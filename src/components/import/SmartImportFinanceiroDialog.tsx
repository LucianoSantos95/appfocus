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
import {
  Sparkles,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { FileDropzone } from "./FileDropzone";
import { useSmartImportFinanceiro, type SmartTransaction } from "@/hooks/useSmartImportFinanceiro";
import { useImportHistory } from "@/hooks/useImportHistory";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface SmartImportFinanceiroDialogProps {
  onImportComplete?: () => void;
  trigger?: React.ReactNode;
}

export function SmartImportFinanceiroDialog({
  onImportComplete,
  trigger,
}: SmartImportFinanceiroDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const { analyzing, importing, result, error, analyzeFile, importTransactions, reset } =
    useSmartImportFinanceiro();
  const { addEntry } = useImportHistory();
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      await analyzeFile(file);
    } catch (e) {
      toast({
        title: "Falha ao analisar",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async () => {
    if (!result?.transactions?.length) return;
    try {
      const inserted = await importTransactions(result.transactions);
      await addEntry({
        module: "financeiro",
        file_name: fileName,
        total_records: result.transactions.length,
        imported_records: inserted.length,
        error_records: result.transactions.length - inserted.length,
        status: "completo",
        metadata: { mode: "smart-ai", summary: result.summary },
      });
      toast({
        title: "Importação concluída",
        description: `${inserted.length} transações criadas.`,
      });
      onImportComplete?.();
      handleClose();
    } catch (e) {
      toast({
        title: "Erro ao importar",
        description: e instanceof Error ? e.message : "Erro",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFileName("");
    reset();
  };

  const totalReceita =
    result?.transactions
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + Math.abs(t.value), 0) ?? 0;
  const totalDespesa =
    result?.transactions
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + Math.abs(t.value), 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Importar com IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Importação Inteligente — Financeiro
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Envie qualquer planilha financeira (DRE, fluxo de caixa, projeções, extratos). A IA
            entende o layout, extrai as transações e categoriza automaticamente.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!result && !analyzing && !error && (
            <FileDropzone onFileSelect={handleFile} />
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-foreground font-medium">Analisando planilha com IA...</p>
              <p className="text-sm text-muted-foreground">
                Isso pode levar até 30 segundos para arquivos complexos.
              </p>
            </div>
          )}

          {error && !analyzing && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-destructive font-medium">{error}</p>
              <Button variant="outline" onClick={reset}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {result.transactions.length} transações detectadas
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-card border">
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-lg font-semibold text-foreground">
                    R$ {totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-card border">
                  <p className="text-xs text-muted-foreground">Despesas</p>
                  <p className="text-lg font-semibold text-foreground">
                    R$ {totalDespesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.transactions.slice(0, 100).map((t: SmartTransaction, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">
                          {t.date ? format(new Date(t.date), "dd/MM/yy") : "-"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {t.description}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.category || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.type === "receita" ? "default" : "secondary"}>
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          R$ {Math.abs(t.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {result.transactions.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-2 border-t">
                    Mostrando 100 de {result.transactions.length}. Todas serão importadas.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-3 h-3" />
            {fileName || "Nenhum arquivo"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            {result && (
              <Button onClick={handleConfirm} disabled={importing} className="gap-2">
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Confirmar e importar {result.transactions.length}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
