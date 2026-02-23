import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Transacao {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string | null;
  type: string;
  status: string;
  payment_method: string | null;
  client: string | null;
  provider: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransacaoInput {
  description: string;
  value: number;
  date?: string;
  category?: string;
  type: string;
  status?: string;
  payment_method?: string;
  client?: string;
  provider?: string;
  notes?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function useTransacoes() {
  const { toast } = useToast();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransacoes = useCallback(async () => {
    try {
      const { data, error } = await sb.from("transacoes").select("*").order("date", { ascending: false });
      if (error) throw error;
      setTransacoes(data || []);
    } catch (error) {
      console.error("Error fetching transacoes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTransacao = async (input: TransacaoInput): Promise<Transacao | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await sb.from("transacoes").insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      setTransacoes(prev => [data, ...prev]);
      toast({ title: "Transação adicionada!", description: `${input.description} foi registrada.` });
      return data;
    } catch (error) {
      console.error("Error adding transacao:", error);
      toast({ title: "Erro ao adicionar transação", variant: "destructive" });
      return null;
    }
  };

  const updateTransacao = async (id: string, updates: Partial<TransacaoInput>): Promise<boolean> => {
    try {
      const { error } = await sb.from("transacoes").update(updates).eq("id", id);
      if (error) throw error;
      setTransacoes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast({ title: "Transação atualizada!" });
      return true;
    } catch (error) {
      console.error("Error updating transacao:", error);
      toast({ title: "Erro ao atualizar transação", variant: "destructive" });
      return false;
    }
  };

  const deleteTransacao = async (id: string): Promise<boolean> => {
    try {
      const { error } = await sb.from("transacoes").delete().eq("id", id);
      if (error) throw error;
      setTransacoes(prev => prev.filter(t => t.id !== id));
      toast({ title: "Transação excluída" });
      return true;
    } catch (error) {
      console.error("Error deleting transacao:", error);
      toast({ title: "Erro ao excluir transação", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchTransacoes(); }, [fetchTransacoes]);

  return { transacoes, isLoading, addTransacao, updateTransacao, deleteTransacao, refetch: fetchTransacoes };
}
