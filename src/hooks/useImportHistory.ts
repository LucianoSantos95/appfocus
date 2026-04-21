import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ImportHistoryEntry {
  id: string;
  module: string;
  file_name: string | null;
  total_records: number;
  imported_records: number;
  error_records: number;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useImportHistory(module?: string) {
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    let q = supabase
      .from("import_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (module) q = q.eq("module", module);
    const { data, error } = await q;
    if (!error && data) setHistory(data as ImportHistoryEntry[]);
    setIsLoading(false);
  }, [module]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addEntry = useCallback(
    async (entry: {
      module: string;
      file_name?: string;
      total_records: number;
      imported_records: number;
      error_records: number;
      status?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data, error } = await supabase
        .from("import_history")
        .insert({
          user_id: userData.user.id,
          module: entry.module,
          file_name: entry.file_name ?? null,
          total_records: entry.total_records,
          imported_records: entry.imported_records,
          error_records: entry.error_records,
          status: entry.status ?? "completo",
          metadata: entry.metadata ?? {},
        })
        .select()
        .single();
      if (!error && data) {
        setHistory((h) => [data as ImportHistoryEntry, ...h]);
      }
      return data;
    },
    []
  );

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from("import_history").delete().eq("id", id);
    if (!error) setHistory((h) => h.filter((e) => e.id !== id));
  }, []);

  return { history, isLoading, refetch: fetchHistory, addEntry, deleteEntry };
}
