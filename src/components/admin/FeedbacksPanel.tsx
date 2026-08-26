import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, MessageSquare } from "lucide-react";

// Feedbacks do Hub Central agrupados por produto. `pagina` guarda o slug do
// produto quando o feedback veio do fluxo do catálogo; qualquer outro valor
// (ex.: "/") cai no grupo "Geral".
const sb = supabase as any;

interface Feedback {
  id: string;
  nome: string | null;
  email: string | null;
  mensagem: string;
  avaliacao: number | null;
  pagina: string | null;
  created_at: string;
}

const GERAL = "__geral__";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

function Estrelas({ nota }: { nota: number | null }) {
  if (!nota) return <span className="text-xs text-muted-foreground">sem nota</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= nota ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export function FeedbacksPanel() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [slugs, setSlugs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: fb }, { data: prod }] = await Promise.all([
        sb.from("feedbacks").select("*").order("created_at", { ascending: false }),
        sb.from("produtos").select("slug,nome"),
      ]);
      setFeedbacks((fb as Feedback[]) || []);
      const mapa: Record<string, string> = {};
      for (const p of (prod as { slug: string; nome: string }[]) || []) mapa[p.slug] = p.nome;
      setSlugs(mapa);
      setLoading(false);
    })();
  }, []);

  const grupos = useMemo(() => {
    const por: Record<string, { chave: string; nome: string; itens: Feedback[] }> = {};
    for (const f of feedbacks) {
      const slug = f.pagina && slugs[f.pagina] ? f.pagina : GERAL;
      if (!por[slug]) por[slug] = { chave: slug, nome: slug === GERAL ? "Geral" : slugs[slug], itens: [] };
      por[slug].itens.push(f);
    }
    return Object.values(por).map((g) => {
      const notas = g.itens.map((i) => i.avaliacao).filter((n): n is number => !!n);
      const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
      return { ...g, media, qtdNotas: notas.length };
    }).sort((a, b) => (b.media ?? -1) - (a.media ?? -1));
  }, [feedbacks, slugs]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (feedbacks.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Nenhum feedback recebido ainda.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {feedbacks.length} {feedbacks.length === 1 ? "feedback" : "feedbacks"} · resumo por produto
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => (
            <Card key={g.chave}>
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium text-foreground line-clamp-2">{g.nome}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-grotesk text-2xl font-extrabold tracking-tight">
                    {g.media != null ? g.media.toFixed(1) : "—"}
                  </span>
                  <Estrelas nota={g.media != null ? Math.round(g.media) : null} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-muted-foreground">
                    {g.qtdNotas} {g.qtdNotas === 1 ? "avaliação" : "avaliações"}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {g.itens.length} {g.itens.length === 1 ? "comentário" : "comentários"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {grupos.map((g) => (
          <div key={g.chave} className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">{g.nome}</h3>
              <span className="text-xs text-muted-foreground">({g.itens.length})</span>
            </div>
            {g.itens.map((f) => (
              <Card key={f.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Estrelas nota={f.avaliacao} />
                    <span className="text-xs text-muted-foreground">{fmt(f.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">{f.mensagem}</p>
                  {(f.nome || f.email) && (
                    <p className="text-xs text-muted-foreground">
                      {[f.nome, f.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
