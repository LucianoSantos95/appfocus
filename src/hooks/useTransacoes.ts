import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

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
  bank_account_id: string | null;
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
  bank_account_id?: string;
}

export function useTransacoes() {
  const { toast } = useToast();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransacoes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("transacoes").select("*").order("date", { ascending: false });
      if (error) throw error;
      setTransacoes((data as Transacao[]) || []);
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
      const { data, error } = await supabase.from("transacoes").insert({ ...input, user_id: user.id } as never).select().single();
      if (error) throw error;
      const newT = data as Transacao;
      setTransacoes(prev => [newT, ...prev]);
      toast({ title: "Transação adicionada!", description: `${input.description} foi registrada.` });
      return newT;
    } catch (error) {
      console.error("Error adding transacao:", error);
      toast({ title: "Erro ao adicionar transação", variant: "destructive" });
      return null;
    }
  };

  const updateTransacao = async (id: string, updates: Partial<TransacaoInput>): Promise<boolean> => {
    try {
      const { error } = await supabase.from("transacoes").update(updates as never).eq("id", id);
      if (error) throw error;
      setTransacoes(prev => prev.map(t => t.id === id ? { ...t, ...updates } as Transacao : t));
      return true;
    } catch (error) {
      console.error("Error updating transacao:", error);
      toast({ title: "Erro ao atualizar transação", variant: "destructive" });
      return false;
    }
  };

  const deleteTransacao = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("transacoes").delete().eq("id", id);
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
