import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Colaborador {
  id: string;
  name: string;
  role: string | null;
  department: string | null;
  salary: number | null;
  start_date: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  manager: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColaboradorInput {
  name: string;
  role?: string;
  department?: string;
  salary?: number;
  start_date?: string;
  email?: string;
  phone?: string;
  status?: string;
  manager?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function useColaboradores() {
  const { toast } = useToast();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchColaboradores = useCallback(async () => {
    try {
      const { data, error } = await sb.from("colaboradores").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setColaboradores(data || []);
    } catch (error) {
      console.error("Error fetching colaboradores:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addColaborador = async (input: ColaboradorInput): Promise<Colaborador | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await sb.from("colaboradores").insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      setColaboradores(prev => [data, ...prev]);
      toast({ title: "Colaborador adicionado!", description: `${input.name} foi cadastrado.` });
      return data;
    } catch (error) {
      console.error("Error adding colaborador:", error);
      toast({ title: "Erro ao adicionar colaborador", variant: "destructive" });
      return null;
    }
  };

  const updateColaborador = async (id: string, updates: Partial<ColaboradorInput>): Promise<boolean> => {
    try {
      const { error } = await sb.from("colaboradores").update(updates).eq("id", id);
      if (error) throw error;
      setColaboradores(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast({ title: "Colaborador atualizado!" });
      return true;
    } catch (error) {
      console.error("Error updating colaborador:", error);
      toast({ title: "Erro ao atualizar colaborador", variant: "destructive" });
      return false;
    }
  };

  const deleteColaborador = async (id: string): Promise<boolean> => {
    try {
      const { error } = await sb.from("colaboradores").delete().eq("id", id);
      if (error) throw error;
      setColaboradores(prev => prev.filter(c => c.id !== id));
      toast({ title: "Colaborador excluído" });
      return true;
    } catch (error) {
      console.error("Error deleting colaborador:", error);
      toast({ title: "Erro ao excluir colaborador", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchColaboradores(); }, [fetchColaboradores]);

  return { colaboradores, isLoading, addColaborador, updateColaborador, deleteColaborador, refetch: fetchColaboradores };
}
