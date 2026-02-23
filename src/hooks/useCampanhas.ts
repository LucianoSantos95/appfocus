import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Campanha {
  id: string;
  name: string;
  objective: string | null;
  platforms: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  responsible: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampanhaInput {
  name: string;
  objective?: string;
  platforms?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  responsible?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function useCampanhas() {
  const { toast } = useToast();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampanhas = useCallback(async () => {
    try {
      const { data, error } = await sb.from("campanhas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setCampanhas(data || []);
    } catch (error) {
      console.error("Error fetching campanhas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCampanha = async (input: CampanhaInput): Promise<Campanha | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await sb.from("campanhas").insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      setCampanhas(prev => [data, ...prev]);
      toast({ title: "Campanha adicionada!", description: `${input.name} foi criada.` });
      return data;
    } catch (error) {
      console.error("Error adding campanha:", error);
      toast({ title: "Erro ao adicionar campanha", variant: "destructive" });
      return null;
    }
  };

  const updateCampanha = async (id: string, updates: Partial<CampanhaInput>): Promise<boolean> => {
    try {
      const { error } = await sb.from("campanhas").update(updates).eq("id", id);
      if (error) throw error;
      setCampanhas(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast({ title: "Campanha atualizada!" });
      return true;
    } catch (error) {
      console.error("Error updating campanha:", error);
      toast({ title: "Erro ao atualizar campanha", variant: "destructive" });
      return false;
    }
  };

  const deleteCampanha = async (id: string): Promise<boolean> => {
    try {
      const { error } = await sb.from("campanhas").delete().eq("id", id);
      if (error) throw error;
      setCampanhas(prev => prev.filter(c => c.id !== id));
      toast({ title: "Campanha excluída" });
      return true;
    } catch (error) {
      console.error("Error deleting campanha:", error);
      toast({ title: "Erro ao excluir campanha", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchCampanhas(); }, [fetchCampanhas]);

  return { campanhas, isLoading, addCampanha, updateCampanha, deleteCampanha, refetch: fetchCampanhas };
}
