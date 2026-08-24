import { useState } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, PackageOpen } from "lucide-react";
import logo from "@/assets/logo.png";
import { useProdutos, usePrimeiraVisita, type Produto } from "@/hooks/useProdutos";
import { LeadCaptureDialog } from "@/components/central/LeadCaptureDialog";

// Hub Central — catálogo de produtos SEM LOGIN.
// MVP: só o catálogo (sem landing). As seções seguem a escada de compromisso:
// Notion grátis → Lovable freemium → Advisor.

const SECOES: Array<{ tipo: Produto["tipo"]; titulo: string; sub: string }> = [
  { tipo: "notion",  titulo: "Templates de Notion", sub: "Gratuitos, prontos pra duplicar e usar hoje" },
  { tipo: "lovable", titulo: "Sistemas",             sub: "Aplicações completas pra operação do seu negócio" },
  { tipo: "advisor", titulo: "Advisor",              sub: "Quando você precisa de alguém olhando a sua operação" },
];

function CardProduto({ p, onAbrir }: { p: Produto; onAbrir: (p: Produto) => void }) {
  const acao = () => {
    if (p.captura_lead) return onAbrir(p);
    if (p.link_destino) window.open(p.link_destino, "_blank", "noopener");
  };

  return (
    <button
      onClick={acao}
      className="group text-left rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl leading-none">{p.emoji || "📦"}</span>
        {p.gratuito ? (
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">Grátis</Badge>
        ) : (
          <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
            R$ {Number(p.preco).toLocaleString("pt-BR")}
          </Badge>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-foreground">{p.nome}</h3>
      {p.descricao && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.descricao}</p>}

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        {p.gratuito ? "Pegar agora" : "Quero este"}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}

export default function Central() {
  const { produtos, loading } = useProdutos();
  const primeiraVisita = usePrimeiraVisita();
  const [selecionado, setSelecionado] = useState<Produto | null>(null);

  const porTipo = (t: Produto["tipo"]) => produtos.filter((p) => p.tipo === t);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        path="/central"
        title="Templates e sistemas para sua operação"
        suffix="Hub Central"
        description="Templates de Notion, sistemas e consultoria para organizar a operação do seu negócio. Comece grátis, sem cadastro."
      />

      {/* Cabeçalho enxuto — MVP não tem landing */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-2.5">
          <img src={logo} alt="" className="h-8 w-8 rounded-lg object-cover" width={32} height={32} />
          <span className="font-semibold text-foreground">Hub Central</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary font-medium">
            {primeiraVisita ? "Seja bem-vindo" : "Bom te ver de novo"}
          </span>
          <h1 className="mt-3 font-display text-4xl md:text-5xl leading-tight tracking-tight text-foreground">
            Ferramentas pra organizar <span className="italic gradient-text">sua operação</span>.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            {primeiraVisita
              ? "Comece pelo que resolve sua dor hoje. É de graça e você leva na hora — sem criar conta."
              : "Pegue o que precisar. Sem cadastro, sem custo."}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : produtos.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center">
            <PackageOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 font-medium text-foreground">Catálogo em preparação</p>
            <p className="mt-1 text-sm text-muted-foreground">Volte em breve — tem coisa boa chegando.</p>
          </div>
        ) : (
          <div className="mt-12 space-y-14">
            {SECOES.map((s) => {
              const itens = porTipo(s.tipo);
              if (itens.length === 0) return null; // seção vazia não aparece no MVP
              return (
                <section key={s.tipo}>
                  <h2 className="font-display text-2xl tracking-tight text-foreground">{s.titulo}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.sub}</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {itens.map((p) => (
                      <CardProduto key={p.id} p={p} onAbrir={setSelecionado} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border/60 mt-8">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Plataforma criada pela{" "}
            <a
              href="https://focusinteligente.com.br"
              target="_blank" rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Focus
            </a>
          </p>
          <Button variant="ghost" size="sm" asChild>
            <a href="https://focusinteligente.com.br" target="_blank" rel="noopener noreferrer" className="gap-1.5">
              Conhecer a Focus <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>
      </footer>

      <LeadCaptureDialog produto={selecionado} onOpenChange={(v) => !v && setSelecionado(null)} />
    </div>
  );
}
