import { useSharedResource } from "@/lib/sharedResource";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Tarefa {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  status: string;
  category: string | null;
  responsible: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TarefaInput {
  title: string;
  description?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  category?: string;
  responsible?: string;
  completed_at?: string | null;
}

export function useTarefas() {
  const { toast } = useToast();
  const { logEvent } = useAuditLog();
  const { user } = useAuth();
  const { data: tarefas, isLoading, refetch, mutate } = useSharedResource<any[]>(
    user ? "tarefas:" + user.id : null,
    async () => {
      const { data, error } = await supabase.from("tarefas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    { initial: [], enabled: !!user }
  );

  const addTarefa = async (input: TarefaInput): Promise<Tarefa | null> => {
    try {
      if (!user) return null;
      const { data, error } = await supabase.from("tarefas").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newT = data as Tarefa;
      mutate((prev) => [newT, ...(prev || [])]);
      toast({ title: "Tarefa adicionada!", description: `${input.title} foi criada.` });
      logEvent("create", "tarefas", newT.id, { title: input.title });
      return newT;
    } catch (error) {
      console.error("Error adding tarefa:", error);
      toast({ title: "Erro ao adicionar tarefa", variant: "destructive" });
      return null;
    }
  };

  const updateTarefa = async (id: string, updates: Partial<TarefaInput>): Promise<boolean> => {
    try {
      // Auto-set completed_at when status changes to concluida
      const finalUpdates = { ...updates };
      if (updates.status === "concluida" && !updates.completed_at) {
        (finalUpdates as Record<string, unknown>).completed_at = new Date().toISOString();
      } else if (updates.status && updates.status !== "concluida") {
        (finalUpdates as Record<string, unknown>).completed_at = null;
      }

      const { error } = await supabase.from("tarefas").update(finalUpdates as never).eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).map(t => t.id === id ? { ...t, ...finalUpdates } as Tarefa : t));
      return true;
    } catch (error) {
      console.error("Error updating tarefa:", error);
      toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
      return false;
    }
  };

  const deleteTarefa = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("tarefas").delete().eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).filter(t => t.id !== id));
      toast({ title: "Tarefa excluída" });
      logEvent("delete", "tarefas", id);
      return true;
    } catch (error) {
      console.error("Error deleting tarefa:", error);
      toast({ title: "Erro ao excluir tarefa", variant: "destructive" });
      return false;
    }
  };


  return { tarefas: tarefas || [], isLoading, addTarefa, updateTarefa, deleteTarefa, refetch };
}
