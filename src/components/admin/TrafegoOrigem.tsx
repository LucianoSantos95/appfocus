import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Ev { tipo: string; sessao: string | null; origem?: string | null; created_at: string }

const JANELA_AO_VIVO_MIN = 60;
const TIPOS_FUNIL = ["visita_catalogo", "clique_produto", "lead_enviado"];

// Rejeição = sessão com visita_catalogo e nenhum clique_produto no período.
// A origem da sessão é a da primeira visita; cliques e leads seguem a sessão.
// Eventos novos chegam pelo Realtime e somam aos carregados, sem recarregar.
export function TrafegoOrigem({ eventos, aoVivo = true }: { eventos: Ev[]; aoVivo?: boolean }) {
  const [novos, setNovos] = useState<Ev[]>([]);
  const [agora, setAgora] = useState(Date.now());
  const [conectado, setConectado] = useState(false);

  // Recarga da página já inclui o que chegou ao vivo — zera pra não contar em dobro.
  useEffect(() => { setNovos([]); }, [eventos]);

  useEffect(() => {
    const canal = supabase
      .channel("metricas-eventos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "eventos" }, (payload) => {
        const e = payload.new as Ev;
        if (TIPOS_FUNIL.includes(e.tipo)) setNovos((atual) => [...atual, e]);
      })
      .subscribe((status) => setConectado(status === "SUBSCRIBED"));
    // Só o relógio da janela "última hora" anda sozinho; os dados vêm do Realtime.
    const relogio = setInterval(() => setAgora(Date.now()), 30000);
    return () => { supabase.removeChannel(canal); clearInterval(relogio); };
  }, []);

  // Período fechado (Ontem) não recebe eventos de agora.
  const todos = aoVivo && novos.length ? [...eventos, ...novos] : eventos;

  const sessoes = new Map<string, { origem: string; cliques: number; leads: number }>();
  for (const e of [...todos].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (e.tipo === "visita_catalogo" && e.sessao && !sessoes.has(e.sessao)) {
      sessoes.set(e.sessao, { origem: e.origem || "sem origem", cliques: 0, leads: 0 });
    }
  }
  for (const e of todos) {
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
  const linhas = [...porOrigem.entries()].sort((a, b) => b[1].visitas - a[1].visitas).slice(0, 5);
  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "—");

  const corte = agora - JANELA_AO_VIVO_MIN * 60000;
  const recentes = todos.filter((e) => new Date(e.created_at).getTime() >= corte);
  const visitasAoVivo = new Set(recentes.filter((e) => e.tipo === "visita_catalogo").map((e) => e.sessao)).size;
  const cliquesAoVivo = recentes.filter((e) => e.tipo === "clique_produto").length;

  return (
    <div>
      <h3 className="font-display text-xl tracking-tight text-foreground mb-3">Tráfego e origem</h3>
      {sessoes.size === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Sem visitas no período.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="grid gap-4 content-start">
            {aoVivo && (<Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${conectado ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`} />
                  <p className="text-xs text-muted-foreground">{conectado ? "Ao vivo" : "Conectando…"} · última hora</p>
                </div>
                <div className="mt-2 flex gap-5">
                  <div>
                    <p className="font-display text-3xl text-foreground tabular-nums" data-testid="aovivo-visitas">{visitasAoVivo}</p>
                    <p className="text-xs text-muted-foreground">visitas</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl text-foreground tabular-nums" data-testid="aovivo-cliques">{cliquesAoVivo}</p>
                    <p className="text-xs text-muted-foreground">cliques</p>
                  </div>
                </div>
              </CardContent>
            </Card>)}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Taxa de rejeição</p>
                <p className="mt-1 font-display text-3xl text-foreground">{pct(semClique, sessoes.size)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {semClique} de {sessoes.size} sessões saíram sem clicar em nenhum produto.
                </p>
              </CardContent>
            </Card>
          </div>
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
