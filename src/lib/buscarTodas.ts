// O backend devolve no máximo 1000 linhas por requisição. Este helper busca
// página a página até acabar — sem teto fixo que volte a quebrar com o volume.
// `montar` deve devolver a consulta já com filtros e uma ordenação estável.
export async function buscarTodas<T>(
  montar: () => any,
  pagina = 1000,
): Promise<T[]> {
  const todas: T[] = [];
  for (let i = 0; ; i++) {
    const { data, error } = await montar().range(i * pagina, i * pagina + pagina - 1);
    if (error) throw error;
    if (!data?.length) break;
    todas.push(...(data as T[]));
    if (data.length < pagina) break;
  }
  return todas;
}
