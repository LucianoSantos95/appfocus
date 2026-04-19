import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RelatorioContato {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  canais_preferidos: string[];
  observacoes: string | null;
  created_at: string;
}

export interface RelatorioContatoInput {
  nome: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  canais_preferidos?: string[];
  observacoes?: string;
}

export function useRelatorioContatos() {
  const { toast } = useToast();
  const [contatos, setContatos] = useState<RelatorioContato[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContatos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("relatorio_contatos" as never)
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      setContatos((data as unknown as RelatorioContato[]) || []);
    } catch (error) {
      console.error("Error fetching contatos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addContato = async (input: RelatorioContatoInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("relatorio_contatos" as never)
        .insert({ ...input, user_id: user.id } as never)
        .select()
        .single();
      if (error) throw error;
      const newC = data as unknown as RelatorioContato;
      setContatos(prev => [...prev, newC].sort((a, b) => a.nome.localeCompare(b.nome)));
      toast({ title: "Contato adicionado!" });
      return newC;
    } catch (error: any) {
      toast({ title: "Erro ao adicionar contato", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateContato = async (id: string, updates: Partial<RelatorioContatoInput>) => {
    try {
      const { error } = await supabase.from("relatorio_contatos" as never).update(updates as never).eq("id", id);
      if (error) throw error;
      setContatos(prev => prev.map(c => c.id === id ? { ...c, ...updates } as RelatorioContato : c));
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const deleteContato = async (id: string) => {
    try {
      const { error } = await supabase.from("relatorio_contatos" as never).delete().eq("id", id);
      if (error) throw error;
      setContatos(prev => prev.filter(c => c.id !== id));
      toast({ title: "Contato removido" });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchContatos(); }, [fetchContatos]);

  return { contatos, isLoading, addContato, updateContato, deleteContato, refetch: fetchContatos };
}
