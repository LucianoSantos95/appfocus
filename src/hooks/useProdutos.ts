import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Catálogo do Hub Central. Leitura pública (RLS libera SELECT dos ativos),
// então funciona sem login.
const sb = supabase as any;

export interface Produto {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  tipo: "notion" | "playbook" | "lovable" | "advisor";
  gratuito: boolean;
  preco: number | null;
  link_destino: string | null;
  captura_lead: boolean;
  emoji: string | null;
  ordem: number;
  destaque: boolean;
  downloads?: number | null;
  capa?: string | null;
  imagens?: string[] | null;
  detalhes?: string | null;
  destaque_temporario_ate?: string | null;
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data, error } = await sb
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .eq("arquivado", false)
        .order("ordem", { ascending: true });
      if (!vivo) return;
      if (error) setErro(true);
      setProdutos((data as Produto[]) || []);
      setLoading(false);
    })();
    return () => { vivo = false; };
  }, []);

  return { produtos, loading, erro };
}

// Primeira visita — cookie/localStorage. Limitação conhecida e aceita:
// aba anônima ou navegador limpo volta a contar como primeira vez.
const CHAVE = "hub_central_visitou";

export function usePrimeiraVisita() {
  const [primeira, setPrimeira] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE) !== "1") {
        setPrimeira(true);
        localStorage.setItem(CHAVE, "1");
      }
    } catch {
      /* modo privado sem storage — trata como visitante recorrente */
    }
  }, []);

  return primeira;
}
