import { Card, CardContent } from "@/components/ui/card";

interface Ev { tipo: string; sessao: string | null; origem?: string | null; created_at: string }

// Rejeição = sessão com visita_catalogo e nenhum clique_produto no período.
// A origem da sessão é a da primeira visita; cliques e leads seguem a sessão.
export function TrafegoOrigem({ eventos }: { eventos: Ev[] }) {
  const sessoes = new Map<string, { origem: string; cliques: number; leads: number }>();
  for (const e of [...eventos].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (e.tipo === "visita_catalogo" && e.sessao && !sessoes.has(e.sessao)) {
      sessoes.set(e.sessao, { origem: e.origem || "sem origem", cliques: 0, leads: 0 });
    }
  }
  for (const e of eventos) {
    const s = e.sessao ? sessoes.get(e.sessao) : undefined;
    if (!s) continue;
    if (e.tipo === "clique_produto") s.cliques++;
    else if (e.tipo === "lead_enviado") s.leads++;
  }

  const porOrigem = new Map<string, { visitas: number; cliques: number; leads: number; semClique: number }>();
  let semClique = 0;
  for (const s of sessoes.values()) {
    const o = porOrigem.get(s.origem) ?? { visitas: 0, cliques: 0, leads: 0, semClique: 0 };
    o.visitas++; o.cliques += s.cliques; o.leads += s.leads;
    if (s.cliques === 0) { o.semClique++; semClique++; }
    porOrigem.set(s.origem, o);
  }
  const linhas = [...porOrigem.entries()].sort((a, b) => b[1].visitas - a[1].visitas);
  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "—");

  return (
    <div>
      <h3 className="font-display text-xl tracking-tight text-foreground mb-3">Tráfego e origem</h3>
      {sessoes.size === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Sem visitas no período.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Taxa de rejeição</p>
              <p className="mt-1 font-display text-3xl text-foreground">{pct(semClique, sessoes.size)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {semClique} de {sessoes.size} sessões saíram sem clicar em nenhum produto.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium p-3">Origem</th>
                    <th className="text-right font-medium p-3">Visitas</th>
                    <th className="text-right font-medium p-3">Cliques</th>
                    <th className="text-right font-medium p-3">Leads</th>
                    <th className="text-right font-medium p-3">Rejeição</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map(([origem, o]) => (
                    <tr key={origem} className="border-b border-border/50 last:border-0">
                      <td className="p-3 font-mono text-xs text-foreground">{origem}</td>
                      <td className="p-3 text-right tabular-nums">{o.visitas}</td>
                      <td className="p-3 text-right tabular-nums">{o.cliques}</td>
                      <td className="p-3 text-right tabular-nums">{o.leads}</td>
                      <td className="p-3 text-right tabular-nums">{pct(o.semClique, o.visitas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
