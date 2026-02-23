import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Tarefa {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  status: string;
  category: string | null;
  responsible: string | null;
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function useTarefas() {
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTarefas = useCallback(async () => {
    try {
      const { data, error } = await sb.from("tarefas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setTarefas(data || []);
    } catch (error) {
      console.error("Error fetching tarefas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTarefa = async (input: TarefaInput): Promise<Tarefa | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await sb.from("tarefas").insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      setTarefas(prev => [data, ...prev]);
      toast({ title: "Tarefa adicionada!", description: `${input.title} foi criada.` });
      return data;
    } catch (error) {
      console.error("Error adding tarefa:", error);
      toast({ title: "Erro ao adicionar tarefa", variant: "destructive" });
      return null;
    }
  };

  const updateTarefa = async (id: string, updates: Partial<TarefaInput>): Promise<boolean> => {
    try {
      const { error } = await sb.from("tarefas").update(updates).eq("id", id);
      if (error) throw error;
      setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      return true;
    } catch (error) {
      console.error("Error updating tarefa:", error);
      toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
      return false;
    }
  };

  const deleteTarefa = async (id: string): Promise<boolean> => {
    try {
      const { error } = await sb.from("tarefas").delete().eq("id", id);
      if (error) throw error;
      setTarefas(prev => prev.filter(t => t.id !== id));
      toast({ title: "Tarefa excluída" });
      return true;
    } catch (error) {
      console.error("Error deleting tarefa:", error);
      toast({ title: "Erro ao excluir tarefa", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchTarefas(); }, [fetchTarefas]);

  return { tarefas, isLoading, addTarefa, updateTarefa, deleteTarefa, refetch: fetchTarefas };
}
