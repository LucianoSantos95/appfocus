import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
      className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-foreground/25 hover:bg-background-elevated sm:flex-row sm:items-start sm:gap-5 ${
        p.destaque ? "border-primary/50" : "border-border"
      }`}
    >
      {p.destaque && (
        <span className="focus-label absolute -top-2.5 left-6 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Recomendado
        </span>
      )}

      {p.capa ? (
        <img
          src={p.capa}
          alt={p.nome}
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-background-elevated text-3xl">
          {p.emoji || "🧭"}
        </div>
      )}

      <div className="mt-4 flex-1 sm:mt-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-grotesk text-xl font-extrabold tracking-tight text-foreground">{p.nome}</h3>
          {p.gratuito ? (
            <span className="focus-label rounded-full border border-border/70 px-2.5 py-1 text-muted-foreground">Grátis</span>
          ) : p.preco != null ? (
            <span className="focus-label rounded-full border border-border/70 px-2.5 py-1 text-muted-foreground">
              R$ {Number(p.preco).toLocaleString("pt-BR")}
            </span>
          ) : null}
        </div>

        {p.descricao && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.descricao}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full px-4" onClick={saibaMais}>Saiba mais</Button>
          <Button size="sm" onClick={falar} className="group gap-1.5 rounded-full px-4">
            Falar com a Focus
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
