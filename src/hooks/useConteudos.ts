import { useSharedResource } from "@/lib/sharedResource";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Conteudo {
  id: string;
  title: string;
  description: string | null;
  platform: string | null;
  scheduled_date: string | null;
  status: string;
  approval_status: string;
  approval_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConteudoInput {
  title: string;
  description?: string;
  platform?: string;
  scheduled_date?: string;
  status?: string;
  approval_status?: string;
  approval_feedback?: string | null;
}

export function useConteudos() {
  const { toast } = useToast();
  const { logEvent } = useAuditLog();
  const { user } = useAuth();
  const { data: conteudos, isLoading, refetch, mutate } = useSharedResource<any[]>(
    user ? "conteudos:" + user.id : null,
    async () => {
      const { data, error } = await supabase.from("conteudos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    { initial: [], enabled: !!user }
  );

  const addConteudo = async (input: ConteudoInput): Promise<Conteudo | null> => {
    try {
      if (!user) return null;
      const { data, error } = await supabase.from("conteudos").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newC = data as Conteudo;
      mutate((prev) => [...(prev || []), newC]);
      toast({ title: "Conteúdo adicionado!" });
      logEvent("create", "conteudos", newC.id, { title: input.title });
      return newC;
    } catch (error) {
      console.error("Error adding conteudo:", error);
      toast({ title: "Erro ao adicionar conteúdo", variant: "destructive" });
      return null;
    }
  };

  const updateConteudo = async (id: string, updates: Partial<ConteudoInput>): Promise<boolean> => {
    try {
      const { error } = await supabase.from("conteudos").update(updates as never).eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).map(c => c.id === id ? { ...c, ...updates } as Conteudo : c));
      return true;
    } catch (error) {
      console.error("Error updating conteudo:", error);
      toast({ title: "Erro ao atualizar conteúdo", variant: "destructive" });
      return false;
    }
  };

  const deleteConteudo = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("conteudos").delete().eq("id", id);
      if (error) throw error;
      mutate((prev) => (prev || []).filter(c => c.id !== id));
      toast({ title: "Conteúdo excluído" });
      logEvent("delete", "conteudos", id);
      return true;
    } catch (error) {
      console.error("Error deleting conteudo:", error);
      toast({ title: "Erro ao excluir conteúdo", variant: "destructive" });
      return false;
    }
  };


  return { conteudos: conteudos || [], isLoading, addConteudo, updateConteudo, deleteConteudo, refetch };
}
