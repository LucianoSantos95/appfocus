import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isValidHttpUrl } from "@/lib/validation";
import { useAuditLog } from "@/hooks/useAuditLog";
import { stripHtml } from "@/lib/sanitize";

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  segmento: string | null;
  status: string;
  valor_total: number | null;
  tipo_contrato: string | null;
  ultima_interacao: string | null;
  anexo_url: string | null;
  empresa: string | null;
  classificacao: string | null;
  potencial: string | null;
  prioridade_contato: string | null;
  palavras_chave: string[] | null;
  proxima_acao_sugerida: string | null;
  analisado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClienteInput {
  nome: string;
  email?: string;
  telefone?: string;
  segmento?: string;
  status?: string;
  valor_total?: number;
  tipo_contrato?: string;
  anexo_url?: string;
  empresa?: string;
}

export function useClientes() {
  const { toast } = useToast();
  const { logEvent } = useAuditLog();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch all clients
  const fetchClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientes((data as Cliente[]) || []);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Add new client
  const addCliente = async (input: ClienteInput): Promise<Cliente | null> => {
    // Validate anexo_url if provided
    if (input.anexo_url && !isValidHttpUrl(input.anexo_url)) {
      toast({
        title: "URL inválida",
        description: "O link do documento deve ser uma URL válida (http/https).",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Get current user for ownership
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from("clientes")
        .insert({
          nome: input.nome,
          email: input.email || null,
          telefone: input.telefone || null,
          segmento: input.segmento || null,
          status: input.status || "prospecto",
          valor_total: input.valor_total || 0,
          tipo_contrato: input.tipo_contrato || null,
          anexo_url: input.anexo_url || null,
          empresa: input.empresa || input.nome,
          ultima_interacao: new Date().toISOString().split("T")[0],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newCliente = data as Cliente;
      setClientes((prev) => [newCliente, ...prev]);

      // Trigger AI analysis for new client
      analyzeCliente(newCliente.id);
      logEvent("create", "clientes", newCliente.id, { nome: input.nome });

      toast({
        title: "Cliente adicionado!",
        description: `${input.nome} foi cadastrado com sucesso.`,
      });

      return newCliente;
    } catch (error) {
      console.error("Error adding cliente:", error);
      toast({
        title: "Erro ao adicionar cliente",
        description: "Não foi possível salvar o cliente.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update client
  const updateCliente = async (id: string, updates: Partial<ClienteInput>): Promise<boolean> => {
    // Validate anexo_url if provided
    if (updates.anexo_url && !isValidHttpUrl(updates.anexo_url)) {
      toast({
        title: "URL inválida",
        description: "O link do documento deve ser uma URL válida (http/https).",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("clientes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      // Trigger AI analysis after update
      analyzeCliente(id);
      logEvent("update", "clientes", id);

      toast({
        title: "Cliente atualizado!",
        description: "As alterações foram salvas.",
      });

      return true;
    } catch (error) {
      console.error("Error updating cliente:", error);
      toast({
        title: "Erro ao atualizar cliente",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete client
  const deleteCliente = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClientes((prev) => prev.filter((c) => c.id !== id));
      logEvent("delete", "clientes", id);

      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido com sucesso.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting cliente:", error);
      toast({
        title: "Erro ao excluir cliente",
        description: "Não foi possível remover o cliente.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Analyze single client with AI
  const analyzeCliente = async (clienteId: string): Promise<boolean> => {
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error("No auth session available for AI analysis");
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ clienteId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          toast({
            title: "Sessão expirada",
            description: "Por favor, faça login novamente.",
            variant: "destructive",
          });
          return false;
        }
        if (response.status === 429) {
          toast({
            title: "Limite de requisições",
            description: "Aguarde alguns segundos antes de tentar novamente.",
            variant: "destructive",
          });
          return false;
        }
        throw new Error(error.error || "Erro na análise");
      }

      const result = await response.json();

      // Update local state with analysis results
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteId
            ? {
                ...c,
                classificacao: result.analysis.classificacao,
                potencial: result.analysis.potencial,
                prioridade_contato: result.analysis.prioridade_contato,
                palavras_chave: result.analysis.palavras_chave,
                proxima_acao_sugerida: result.analysis.proxima_acao_sugerida,
                analisado_em: result.analysis.analisado_em,
              }
            : c
        )
      );

      return true;
    } catch (error) {
      console.error("Error analyzing cliente:", error);
      return false;
    }
  };

  // Analyze all clients
  const analyzeAllClientes = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    const clientesToAnalyze = clientes.filter((c) => !c.classificacao);
    let successCount = 0;
    let errorCount = 0;

    for (const cliente of clientesToAnalyze) {
      const success = await analyzeCliente(cliente.id);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsAnalyzing(false);

    if (successCount > 0) {
      toast({
        title: "Análise concluída!",
        description: `${successCount} cliente(s) analisado(s) com sucesso.`,
      });
    }

    if (errorCount > 0) {
      toast({
        title: "Algumas análises falharam",
        description: `${errorCount} cliente(s) não puderam ser analisados.`,
        variant: "destructive",
      });
    }
  };

  // Convert prospect to active client
  const convertToAtivo = async (
    id: string,
    tipoContrato: string,
    valorContrato: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          status: "ativo",
          tipo_contrato: tipoContrato,
          valor_total: valorContrato,
          ultima_interacao: new Date().toISOString().split("T")[0],
        })
        .eq("id", id);

      if (error) throw error;

      setClientes((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "ativo",
                tipo_contrato: tipoContrato,
                valor_total: valorContrato,
                ultima_interacao: new Date().toISOString().split("T")[0],
              }
            : c
        )
      );

      // Re-analyze after conversion
      analyzeCliente(id);

      return true;
    } catch (error) {
      console.error("Error converting cliente:", error);
      toast({
        title: "Erro ao converter cliente",
        description: "Não foi possível converter o prospecto.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    clientes,
    isLoading,
    isAnalyzing,
    addCliente,
    updateCliente,
    deleteCliente,
    analyzeCliente,
    analyzeAllClientes,
    convertToAtivo,
    refetch: fetchClientes,
  };
}
