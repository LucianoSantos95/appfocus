import { describe, expect, it, vi } from "vitest";
import { buscarTodas } from "./buscarTodas";

// Simula o builder do supabase-js: `montar()` devolve um objeto cujo `.range()`
// responde com a fatia pedida de um conjunto fixo de linhas.
function fonte(linhas: number[]) {
  const chamadas: Array<[number, number]> = [];
  const montar = vi.fn(() => ({
    range: async (de: number, ate: number) => {
      chamadas.push([de, ate]);
      return { data: linhas.slice(de, ate + 1), error: null };
    },
  }));
  return { montar, chamadas };
}

describe("buscarTodas", () => {
  it("busca página a página até a última, que vem incompleta", async () => {
    const { montar, chamadas } = fonte([1, 2, 3, 4, 5, 6, 7]);
    const r = await buscarTodas<number>(montar, 3);
    expect(r).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(chamadas).toEqual([
      [0, 2],
      [3, 5],
      [6, 8],
    ]);
  });

  it("quando o total é múltiplo da página, para na página vazia seguinte", async () => {
    const { montar, chamadas } = fonte([1, 2, 3, 4, 5, 6]);
    const r = await buscarTodas<number>(montar, 3);
    expect(r).toEqual([1, 2, 3, 4, 5, 6]);
    expect(chamadas).toHaveLength(3);
  });

  it("devolve lista vazia sem repetir a busca", async () => {
    const { montar, chamadas } = fonte([]);
    expect(await buscarTodas<number>(montar, 3)).toEqual([]);
    expect(chamadas).toHaveLength(1);
  });

  it("monta uma consulta nova a cada página", async () => {
    const { montar } = fonte([1, 2, 3, 4]);
    await buscarTodas<number>(montar, 2);
    expect(montar).toHaveBeenCalledTimes(3);
  });

  it("usa 1000 linhas por página por padrão (o teto do PostgREST)", async () => {
    const { montar, chamadas } = fonte([1]);
    await buscarTodas<number>(montar);
    expect(chamadas[0]).toEqual([0, 999]);
  });

  it("propaga o erro da consulta em vez de devolver dados parciais", async () => {
    const erro = new Error("falhou");
    const montar = () => ({ range: async () => ({ data: null, error: erro }) });
    await expect(buscarTodas(montar, 3)).rejects.toBe(erro);
  });
});
