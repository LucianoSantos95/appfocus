import { supabase } from "@/integrations/supabase/client";

// Telemetria mínima do Hub Central, só o suficiente pra ler o funil:
//   visita_catalogo → clique_produto → lead_enviado
// A sessão é um id anônimo por aba/navegador — não identifica pessoa,
// serve pra não contar a mesma visita várias vezes.

const sb = supabase as any;
const CHAVE_SESSAO = "hub_central_sessao";

function sessaoId(): string {
  try {
    let id = sessionStorage.getItem(CHAVE_SESSAO);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(CHAVE_SESSAO, id);
    }
    return id;
  } catch {
    return "sem-storage";
  }
}

export type TipoEvento = "visita_catalogo" | "clique_produto" | "lead_enviado";

/** Registra um evento. Best-effort: nunca quebra nem atrasa a interface. */
export function registrarEvento(tipo: TipoEvento, produto?: string) {
  try {
    // O builder do supabase-js é lazy: só dispara a requisição quando alguém
    // chama .then(). Um `void` aqui criaria o builder e nunca enviaria nada.
    sb.from("eventos")
      .insert({ tipo, produto: produto ?? null, sessao: sessaoId() })
      .then(
        () => {},
        () => {}, // telemetria nunca deve atrapalhar o usuário
      );
  } catch {
    /* idem */
  }
}
