import { useSharedResource } from "@/lib/sharedResource";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Processo {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  owner: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessoInput {
  name: string;
  description?: string;
  department?: string;
  owner?: string;
  status?: string;
}

export function useProcessos() {
  const { toast } = useToast();
  const { logEvent } = useAuditLog();
  const { user } = useAuth();
  const { data: processos, isLoading, refetch, mutate } = useSharedResource<any[]>(
    user ? "processos:" + user.id : null,
    async () => {
      const { data, error } = await supabase.from("processos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    { initial: [], enabled: !!user }
  );

  const addProcesso = async (input: ProcessoInput): Promise<Processo | null> => {
    try {
      if (!user) return null;
      const { data, error } = await supabase.from("processos").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newP = data as Processo;
      mutate((prev) => [newP, ...(prev || [])]);
      toast({ title: "Processo adicionado!", description: `${input.name} foi criado.` });
      logEvent("create", "processos", newP.id, { name: input.name });
      return newP;
    } catch (error) {
      console.error("Error adding processo:", error);
      toast({ title: "Erro ao adicionar processo", variant: "destructive" });
      return null;
    }
  };

  const updateProcesso = async (id: string, updates: Partial<ProcessoInput>): Promise<boolean> => {
    try {
      const { error } = await supabase.from("processos").update(updates as never).eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).map(p => p.id === id ? { ...p, ...updates } as Processo : p));
      toast({ title: "Processo atualizado!" });
      return true;
    } catch (error) {
      console.error("Error updating processo:", error);
      toast({ title: "Erro ao atualizar processo", variant: "destructive" });
      return false;
    }
  };

  const deleteProcesso = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("processos").delete().eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).filter(p => p.id !== id));
      toast({ title: "Processo excluído" });
      logEvent("delete", "processos", id);
      return true;
    } catch (error) {
      console.error("Error deleting processo:", error);
      toast({ title: "Erro ao excluir processo", variant: "destructive" });
      return false;
    }
  };


  return { processos: processos || [], isLoading, addProcesso, updateProcesso, deleteProcesso, refetch };
}
