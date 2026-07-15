import { useSharedResource } from "@/lib/sharedResource";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Projeto {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  responsible: string | null;
  description: string | null;
  cliente_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjetoInput {
  name: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  responsible?: string;
  description?: string;
  cliente_id?: string | null;
}

export function useProjetos() {
  const { toast } = useToast();
  const { logEvent } = useAuditLog();
  const { user } = useAuth();
  const { data: projetos, isLoading, refetch, mutate } = useSharedResource<any[]>(
    user ? "projetos:" + user.id : null,
    async () => {
      const { data, error } = await supabase.from("projetos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    { initial: [], enabled: !!user }
  );

  const addProjeto = async (input: ProjetoInput): Promise<Projeto | null> => {
    try {
      if (!user) return null;
      const { data, error } = await supabase.from("projetos").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newP = data as Projeto;
      mutate((prev) => [newP, ...(prev || [])]);
      toast({ title: "Projeto adicionado!", description: `${input.name} foi criado.` });
      logEvent("create", "projetos", newP.id, { name: input.name });
      return newP;
    } catch (error) {
      console.error("Error adding projeto:", error);
      toast({ title: "Erro ao adicionar projeto", variant: "destructive" });
      return null;
    }
  };

  const updateProjeto = async (id: string, updates: Partial<ProjetoInput>): Promise<boolean> => {
    try {
      const { error } = await supabase.from("projetos").update(updates as never).eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).map(p => p.id === id ? { ...p, ...updates } as Projeto : p));
      toast({ title: "Projeto atualizado!" });
      logEvent("update", "projetos", id);
      return true;
    } catch (error) {
      console.error("Error updating projeto:", error);
      toast({ title: "Erro ao atualizar projeto", variant: "destructive" });
      return false;
    }
  };

  const deleteProjeto = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("projetos").delete().eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).filter(p => p.id !== id));
      toast({ title: "Projeto excluído" });
      logEvent("delete", "projetos", id);
      return true;
    } catch (error) {
      console.error("Error deleting projeto:", error);
      toast({ title: "Erro ao excluir projeto", variant: "destructive" });
      return false;
    }
  };


  return { projetos: projetos || [], isLoading, addProjeto, updateProjeto, deleteProjeto, refetch };
}
