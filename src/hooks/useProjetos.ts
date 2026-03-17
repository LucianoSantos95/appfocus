import { useState, useEffect, useCallback } from "react";
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
}

export function useProjetos() {
  const { toast } = useToast();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjetos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("projetos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProjetos((data as Projeto[]) || []);
    } catch (error) {
      console.error("Error fetching projetos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProjeto = async (input: ProjetoInput): Promise<Projeto | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("projetos").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newP = data as Projeto;
      setProjetos(prev => [newP, ...prev]);
      toast({ title: "Projeto adicionado!", description: `${input.name} foi criado.` });
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
      setProjetos(prev => prev.map(p => p.id === id ? { ...p, ...updates } as Projeto : p));
      toast({ title: "Projeto atualizado!" });
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
      setProjetos(prev => prev.filter(p => p.id !== id));
      toast({ title: "Projeto excluído" });
      return true;
    } catch (error) {
      console.error("Error deleting projeto:", error);
      toast({ title: "Erro ao excluir projeto", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchProjetos(); }, [fetchProjetos]);

  return { projetos, isLoading, addProjeto, updateProjeto, deleteProjeto, refetch: fetchProjetos };
}
