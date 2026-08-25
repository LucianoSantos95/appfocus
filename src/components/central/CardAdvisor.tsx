import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Produto } from "@/hooks/useProdutos";
import { registrarEvento } from "@/lib/eventos";

// Advisor não é produto de prateleira — o cartão segue o formato "perfil de
// consultor": avatar, bio curta e dois CTAs (saber mais / falar com a gente).
export function CardAdvisor({ p, onAbrir }: { p: Produto; onAbrir: (p: Produto) => void }) {
  // Todo clique abre o detalhe — é lá que a pessoa vê as imagens, o que é o
  // Advisor e o valor, antes de deixar o contato.
  const abrir = () => {
    registrarEvento("clique_produto", p.slug);
    onAbrir(p);
  };
  const falar = abrir;
  const saibaMais = abrir;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-premium sm:flex-row sm:items-start sm:gap-5 ${
        p.destaque ? "border-primary/60 ring-1 ring-primary/30" : "border-border"
      }`}
    >
      {p.destaque && (
        <Badge className="absolute -top-2.5 left-6 gap-1 font-mono text-[10px] uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Recomendado
        </Badge>
      )}

      {p.capa ? (
        <img
          src={p.capa}
          alt={p.nome}
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xl">
          {p.emoji || "🧭"}
        </div>
      )}

      <div className="mt-4 flex-1 sm:mt-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{p.nome}</h3>
          {p.gratuito ? (
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">Grátis</Badge>
          ) : p.preco != null ? (
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
              R$ {Number(p.preco).toLocaleString("pt-BR")}
            </Badge>
          ) : null}
        </div>

        {p.descricao && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.descricao}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={saibaMais}>Saiba mais</Button>
          <Button size="sm" onClick={falar} className="group gap-1.5">
            Falar com a Focus
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
