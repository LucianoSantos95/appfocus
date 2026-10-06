import { beforeEach, describe, expect, it, vi } from "vitest";

// O módulo fala com o Supabase; aqui só interessa o que ele manda inserir.
const inseridos = vi.hoisted(() => [] as Array<Record<string, unknown>>);
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: (linha: Record<string, unknown>) => {
        inseridos.push(linha);
        return { then: () => {} };
      },
    }),
  },
}));

import { registrarEvento } from "./eventos";

function definirReferrer(valor: string) {
  Object.defineProperty(document, "referrer", { value: valor, configurable: true });
}

beforeEach(() => {
  inseridos.length = 0;
  sessionStorage.clear();
  definirReferrer("");
  window.history.replaceState({}, "", "/");
});

describe("registrarEvento", () => {
  it("grava tipo e produto, e produto vira null quando omitido", () => {
    registrarEvento("clique_produto", "controle-financeiro");
    registrarEvento("visita_catalogo");
    expect(inseridos[0]).toMatchObject({ tipo: "clique_produto", produto: "controle-financeiro" });
    expect(inseridos[1]).toMatchObject({ tipo: "visita_catalogo", produto: null });
  });

  it("origem é 'direto' sem referrer", () => {
    registrarEvento("visita_catalogo");
    expect(inseridos[0]?.origem).toBe("direto");
  });

  it("origem é o domínio do referrer", () => {
    definirReferrer("https://www.notion.com/templates/qualquer-coisa");
    registrarEvento("visita_catalogo");
    expect(inseridos[0]?.origem).toBe("www.notion.com");
  });

  it("origem é 'interno' quando o referrer é o próprio site", () => {
    definirReferrer(`${window.location.origin}/outra-pagina`);
    registrarEvento("visita_catalogo");
    expect(inseridos[0]?.origem).toBe("interno");
  });

  it("referrer inválido cai em 'direto', sem quebrar", () => {
    definirReferrer("isso não é uma url");
    expect(() => registrarEvento("visita_catalogo")).not.toThrow();
    expect(inseridos[0]?.origem).toBe("direto");
  });

  it("captura utm_source e utm_medium da URL", () => {
    window.history.replaceState({}, "", "/?utm_source=notion&utm_medium=marketplace");
    registrarEvento("visita_catalogo");
    expect(inseridos[0]).toMatchObject({ utm_source: "notion", utm_medium: "marketplace" });
  });

  it("sem UTM, os campos vão como null", () => {
    registrarEvento("visita_catalogo");
    expect(inseridos[0]).toMatchObject({ utm_source: null, utm_medium: null });
  });

  it("mantém o mesmo id de sessão entre eventos da mesma aba", () => {
    registrarEvento("visita_catalogo");
    registrarEvento("clique_produto", "x");
    expect(inseridos[0]?.sessao).toBeTruthy();
    expect(inseridos[1]?.sessao).toBe(inseridos[0]?.sessao);
  });

  it("nunca lança erro, mesmo quando o envio falha", async () => {
    vi.resetModules();
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        from: () => {
          throw new Error("rede fora do ar");
        },
      },
    }));
    const { registrarEvento: comFalha } = await import("./eventos");
    expect(() => comFalha("visita_catalogo")).not.toThrow();
  });
});
