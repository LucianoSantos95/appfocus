import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CampanhaCliente {
  id: string;
  campanha_id: string;
  cliente_id: string;
  created_at: string;
}

export function useCampanhaClientes() {
  const [links, setLinks] = useState<CampanhaCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("campanha_clientes")
        .select("*");
      if (error) throw error;
      setLinks((data as CampanhaCliente[]) || []);
    } catch (e) {
      console.error("Error fetching campanha_clientes:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLink = async (campanhaId: string, clienteId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("campanha_clientes")
        .insert({ campanha_id: campanhaId, cliente_id: clienteId, user_id: user.id } as never)
        .select()
        .single();
      if (error) throw error;
      setLinks(prev => [...prev, data as CampanhaCliente]);
      return true;
    } catch (e) {
      console.error("Error adding campanha_cliente:", e);
      return false;
    }
  };

  const removeLink = async (campanhaId: string, clienteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("campanha_clientes")
        .delete()
        .eq("campanha_id", campanhaId)
        .eq("cliente_id", clienteId);
      if (error) throw error;
      setLinks(prev => prev.filter(l => !(l.campanha_id === campanhaId && l.cliente_id === clienteId)));
      return true;
    } catch (e) {
      console.error("Error removing campanha_cliente:", e);
      return false;
    }
  };

  const getClientesByCampanha = (campanhaId: string) =>
    links.filter(l => l.campanha_id === campanhaId).map(l => l.cliente_id);

  const getCampanhasByCliente = (clienteId: string) =>
    links.filter(l => l.cliente_id === clienteId).map(l => l.campanha_id);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  return { links, isLoading, addLink, removeLink, getClientesByCampanha, getCampanhasByCliente, refetch: fetchLinks };
}
