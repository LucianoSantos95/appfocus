import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Conteudo {
  id: string;
  title: string;
  description: string | null;
  platform: string | null;
  scheduled_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ConteudoInput {
  title: string;
  description?: string;
  platform?: string;
  scheduled_date?: string;
  status?: string;
}

export function useConteudos() {
  const { toast } = useToast();
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConteudos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("conteudos").select("*").order("scheduled_date", { ascending: true });
      if (error) throw error;
      setConteudos((data as Conteudo[]) || []);
    } catch (error) {
      console.error("Error fetching conteudos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addConteudo = async (input: ConteudoInput): Promise<Conteudo | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("conteudos").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newC = data as Conteudo;
      setConteudos(prev => [...prev, newC]);
      toast({ title: "Conteúdo adicionado!" });
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
      setConteudos(prev => prev.map(c => c.id === id ? { ...c, ...updates } as Conteudo : c));
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
      setConteudos(prev => prev.filter(c => c.id !== id));
      toast({ title: "Conteúdo excluído" });
      return true;
    } catch (error) {
      console.error("Error deleting conteudo:", error);
      toast({ title: "Erro ao excluir conteúdo", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchConteudos(); }, [fetchConteudos]);

  return { conteudos, isLoading, addConteudo, updateConteudo, deleteConteudo, refetch: fetchConteudos };
}
