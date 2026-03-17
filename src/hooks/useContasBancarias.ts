import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface ContaBancaria {
  id: string;
  name: string;
  institution: string | null;
  type: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface ContaBancariaInput {
  name: string;
  institution?: string;
  type?: string;
  balance?: number;
}

export function useContasBancarias() {
  const { toast } = useToast();
  const { logEvent } = useAuditLog();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContas = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("contas_bancarias").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error("Error fetching contas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addConta = async (input: ContaBancariaInput): Promise<ContaBancaria | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("contas_bancarias").insert({
        name: input.name,
        institution: input.institution || null,
        type: input.type || "corrente",
        balance: input.balance || 0,
        user_id: user.id,
      }).select().single();
      if (error) throw error;
      setContas(prev => [...prev, data]);
      toast({ title: "Conta adicionada!", description: `${input.name} foi registrada.` });
      logEvent("create", "contas_bancarias", data.id, { name: input.name });
      return data;
    } catch (error) {
      console.error("Error adding conta:", error);
      toast({ title: "Erro ao adicionar conta", variant: "destructive" });
      return null;
    }
  };

  const updateConta = async (id: string, updates: Partial<ContaBancariaInput>): Promise<boolean> => {
    try {
      const { error } = await supabase.from("contas_bancarias").update(updates).eq("id", id);
      if (error) throw error;
      setContas(prev => prev.map(c => c.id === id ? { ...c, ...updates } as ContaBancaria : c));
      toast({ title: "Conta atualizada!" });
      return true;
    } catch (error) {
      console.error("Error updating conta:", error);
      toast({ title: "Erro ao atualizar conta", variant: "destructive" });
      return false;
    }
  };

  const updateBalance = async (id: string, newBalance: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from("contas_bancarias").update({ balance: newBalance }).eq("id", id);
      if (error) throw error;
      setContas(prev => prev.map(c => c.id === id ? { ...c, balance: newBalance } : c));
      return true;
    } catch (error) {
      console.error("Error updating balance:", error);
      return false;
    }
  };

  const deleteConta = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("contas_bancarias").delete().eq("id", id);
      if (error) throw error;
      setContas(prev => prev.filter(c => c.id !== id));
      toast({ title: "Conta excluída" });
      return true;
    } catch (error) {
      console.error("Error deleting conta:", error);
      toast({ title: "Erro ao excluir conta", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => { fetchContas(); }, [fetchContas]);

  return { contas, isLoading, addConta, updateConta, updateBalance, deleteConta, refetch: fetchContas };
}
