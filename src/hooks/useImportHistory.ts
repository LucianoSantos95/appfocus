import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSharedResource } from "@/lib/sharedResource";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const key = user ? `import_history:${user.id}:${module ?? "all"}` : null;

  const { data: history, isLoading, refetch, mutate } = useSharedResource<ImportHistoryEntry[]>(
    key,
    async () => {
      let q = supabase
        .from("import_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (module) q = q.eq("module", module);
      const { data, error } = await q;
      if (error) throw error;
      return (data as ImportHistoryEntry[]) || [];
    },
    { initial: [], enabled: !!user }
  );

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
      if (!user) return null;
      const { data, error } = await supabase
        .from("import_history")
        .insert([
          {
            user_id: user.id,
            module: entry.module,
            file_name: entry.file_name ?? null,
            total_records: entry.total_records,
            imported_records: entry.imported_records,
            error_records: entry.error_records,
            status: entry.status ?? "completo",
            metadata: (entry.metadata ?? {}) as never,
          },
        ])
        .select()
        .single();
      if (!error && data) {
        mutate((h) => [data as ImportHistoryEntry, ...(h || [])]);
      }
      return data;
    },
    [user, mutate]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("import_history").delete().eq("id", id);
      if (!error) mutate((h) => (h || []).filter((e) => e.id !== id));
    },
    [mutate]
  );

  return { history: history || [], isLoading, refetch, addEntry, deleteEntry };
}
