import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SmartTransaction {
  description: string;
  value: number;
  type: "receita" | "despesa";
  date: string;
  category?: string;
  status?: "confirmado" | "pendente";
  notes?: string;
}

interface AnalyzeResult {
  summary: string;
  transactions: SmartTransaction[];
}

export function useSmartImportFinanceiro() {
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFile = useCallback(async (file: File) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheets = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          raw: false,
          defval: "",
        });
        return { sheetName: name, rows };
      });

      const { data, error: fnError } = await supabase.functions.invoke(
        "smart-import-financeiro",
        {
          body: {
            fileName: file.name,
            sheets,
            defaultYear: new Date().getFullYear(),
          },
        }
      );

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResult(data as AnalyzeResult);
      return data as AnalyzeResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao analisar arquivo";
      setError(msg);
      throw e;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const importTransactions = useCallback(
    async (transactions: SmartTransaction[]) => {
      setImporting(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error("Não autenticado");

        const payload = transactions.map((t) => ({
          user_id: userId,
          description: t.description,
          value: Math.abs(Number(t.value)) || 0,
          type: t.type,
          date: t.date,
          category: t.category ?? null,
          status: t.status ?? "confirmado",
          notes: t.notes ?? null,
        }));

        const { data, error: insErr } = await supabase
          .from("transacoes")
          .insert(payload)
          .select();

        if (insErr) throw insErr;
        return data ?? [];
      } finally {
        setImporting(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { analyzing, importing, result, error, analyzeFile, importTransactions, reset };
}
