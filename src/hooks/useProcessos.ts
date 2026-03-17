import { useState, useEffect, useCallback } from "react";
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
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProcessos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("processos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProcessos((data as Processo[]) || []);
    } catch (error) {
      console.error("Error fetching processos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProcesso = async (input: ProcessoInput): Promise<Processo | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("processos").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newP = data as Processo;
      setProcessos(prev => [newP, ...prev]);
      toast({ title: "Processo adicionado!", description: `${input.name} foi criado.` });
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
      setProcessos(prev => prev.map(p => p.id === id ? { ...p, ...updates } as Processo : p));
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
      setProcessos(prev => prev.filter(p => p.id !== id));
      toast({ title: "Processo excluído" });
      return true;
    } catch (error) {
      console.error("Error deleting processo:", error);
      toast({ title: "Erro ao excluir processo", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchProcessos(); }, [fetchProcessos]);

  return { processos, isLoading, addProcesso, updateProcesso, deleteProcesso, refetch: fetchProcessos };
}
