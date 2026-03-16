import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileDropzone } from "@/components/import/FileDropzone";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Loader2, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ParsedTransaction {
  date: string;
  description: string;
  value: number;
  type: "receita" | "despesa";
}

function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];
    const trnType = block.match(/<TRNTYPE>(.*)/)?.[1]?.trim() || "";
    const dtPosted = block.match(/<DTPOSTED>(.*)/)?.[1]?.trim() || "";
    const trnAmt = block.match(/<TRNAMT>(.*)/)?.[1]?.trim() || "0";
    const memo = block.match(/<MEMO>(.*)/)?.[1]?.trim() || "";
    const name = block.match(/<NAME>(.*)/)?.[1]?.trim() || "";

    const amount = parseFloat(trnAmt.replace(",", "."));
    const year = dtPosted.substring(0, 4);
    const month = dtPosted.substring(4, 6);
    const day = dtPosted.substring(6, 8);
    const dateStr = `${year}-${month}-${day}`;

    transactions.push({
      date: dateStr,
      description: name || memo || trnType,
      value: Math.abs(amount),
      type: amount >= 0 ? "receita" : "despesa",
    });
  }

  return transactions;
}

function parseCSVExtrato(content: string): ParsedTransaction[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const separator = header.includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  const dateIdx = headers.findIndex((h) => h.includes("data") || h.includes("date"));
  const descIdx = headers.findIndex((h) => h.includes("desc") || h.includes("hist") || h.includes("memo"));
  const valueIdx = headers.findIndex((h) => h.includes("valor") || h.includes("amount") || h.includes("value"));

  if (dateIdx === -1 || valueIdx === -1) return [];

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map((c) => c.trim().replace(/"/g, ""));
    if (cols.length <= valueIdx) continue;

    const rawValue = cols[valueIdx].replace(/[^\d.,\-]/g, "").replace(",", ".");
    const amount = parseFloat(rawValue);
    if (isNaN(amount)) continue;

    let dateStr = cols[dateIdx] || "";
    // Try dd/mm/yyyy format
    const ddmmyyyy = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (ddmmyyyy) {
      dateStr = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }

    transactions.push({
      date: dateStr,
      description: descIdx >= 0 ? cols[descIdx] || "Transação importada" : "Transação importada",
      value: Math.abs(amount),
      type: amount >= 0 ? "receita" : "despesa",
    });
  }

  return transactions;
}

interface ImportExtratoDialogProps {
  onImportComplete: () => void;
  trigger?: React.ReactNode;
}

export function ImportExtratoDialog({ onImportComplete, trigger }: ImportExtratoDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      let parsed: ParsedTransaction[];

      if (file.name.toLowerCase().endsWith(".ofx") || file.name.toLowerCase().endsWith(".ofc")) {
        parsed = parseOFX(content);
      } else {
        parsed = parseCSVExtrato(content);
      }

      if (parsed.length === 0) {
        toast({ title: "Nenhuma transação encontrada", description: "Verifique o formato do arquivo.", variant: "destructive" });
        return;
      }

      setTransactions(parsed);
      setStep("preview");
    } catch {
      toast({ title: "Erro ao processar arquivo", variant: "destructive" });
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    setStep("importing");
    setProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Você precisa estar logado", variant: "destructive" });
      return;
    }

    const BATCH = 50;
    let imported = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    for (let i = 0; i < transactions.length; i += BATCH) {
      const batch = transactions.slice(i, i + BATCH).map((t) => ({
        description: t.description,
        value: t.value,
        date: t.date,
        type: t.type,
        status: "pendente",
        user_id: user.id,
      }));

      const { error } = await sb.from("transacoes").insert(batch);
      if (!error) imported += batch.length;
      setProgress(Math.round(((i + batch.length) / transactions.length) * 100));
    }

    setImportedCount(imported);
    setStep("done");
    onImportComplete();
  }, [transactions, onImportComplete, toast]);

  const handleReset = () => {
    setStep("upload");
    setTransactions([]);
    setProgress(0);
    setImportedCount(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Receipt className="w-4 h-4" />
            Importar Extrato
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Importar Extrato Bancário</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importe extratos nos formatos CSV ou OFX. As transações serão adicionadas automaticamente ao seu financeiro.
            </p>
            <FileDropzone onFileSelect={handleFileSelect} accept=".csv,.ofx,.ofc" />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Encontradas <strong className="text-foreground">{transactions.length}</strong> transações no extrato.
            </p>
            <div className="max-h-[300px] overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 text-muted-foreground font-medium">Data</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Descrição</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Valor</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((t, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="p-2 text-foreground">{t.date ? new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</td>
                      <td className="p-2 text-foreground truncate max-w-[180px]">{t.description}</td>
                      <td className="p-2 text-right text-foreground">R$ {t.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === "receita" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {t.type === "receita" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 50 && (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  Mostrando 50 de {transactions.length} transações
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>Cancelar</Button>
              <Button onClick={handleImport}>Importar {transactions.length} transações</Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-foreground">Importando transações...</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
            <div>
              <p className="text-lg font-semibold text-foreground">Importação concluída!</p>
              <p className="text-sm text-muted-foreground">
                {importedCount} transações importadas com sucesso.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
