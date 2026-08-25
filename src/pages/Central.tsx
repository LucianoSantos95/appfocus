import { useEffect, useState } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, PackageOpen, Sparkles, Clock, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { useProdutos, type Produto } from "@/hooks/useProdutos";
import { ProdutoDialog } from "@/components/central/ProdutoDialog";
import { AvisoHubAntigo } from "@/components/central/AvisoHubAntigo";
import { AbasCatalogo } from "@/components/central/AbasCatalogo";
import { CardAdvisor } from "@/components/central/CardAdvisor";
import { Stagger, StaggerItem } from "@/components/motion";
import { registrarEvento } from "@/lib/eventos";

// Hub Central — catálogo de produtos SEM LOGIN.
// Escada de compromisso: Notion grátis → Produtos Lovable → Advisor.
// As três seções aparecem sempre; sem produto no banco, entra um placeholder.

const SECOES: Array<{ tipo: Produto["tipo"]; titulo: string; sub: string; aba: string }> = [
  { tipo: "notion",  aba: "Notion",   titulo: "Templates Notion",  sub: "Gratuitos, prontos pra duplicar e usar hoje" },
  { tipo: "lovable", aba: "Lovable",  titulo: "Produtos Lovable",  sub: "Aplicações completas pra operação do seu negócio" },
  { tipo: "advisor", aba: "Advisor",  titulo: "Fale comigo",       sub: "Quando você precisa de alguém olhando a sua operação" },
];

/* Pílula mono maiúscula com bolinha — assinatura visual do site da Focus. */
function Pill({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: "neutro" | "primario" | "sutil";
}) {
  const cores =
    tom === "primario"
      ? "border-primary/40 text-primary bg-primary/10"
      : tom === "sutil"
        ? "border-border/70 text-muted-foreground bg-transparent"
        : "border-border text-foreground/80 bg-background-elevated";
  return (
    <span className={`focus-label inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${cores}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tom === "primario" ? "bg-primary" : "bg-foreground/40"}`} />
      {children}
    </span>
  );
}

function CardProduto({ p, onAbrir }: { p: Produto; onAbrir: (p: Produto) => void }) {
  // Todo clique abre o detalhe (galeria + info + captura), nunca o link direto.
  const acao = () => {
    registrarEvento("clique_produto", p.slug);
    onAbrir(p);
  };

  return (
    <button
      onClick={acao}
      className={`group relative w-full h-full text-left rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-background-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        p.destaque ? "border-primary/50" : "border-border"
      }`}
    >
      {p.destaque && (
        <span className="absolute -top-2.5 left-6">
          <Pill tom="primario">Recomendado</Pill>
        </span>
      )}

      {p.capa && (
        <img
          src={p.capa}
          alt={p.nome}
          loading="lazy"
          className="mb-5 w-full rounded-xl border border-border object-cover aspect-[16/10] bg-muted"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl leading-none">{p.emoji || "📦"}</span>
        {p.gratuito ? <Pill tom="sutil">Grátis</Pill> : <Pill tom="sutil">R$ {Number(p.preco).toLocaleString("pt-BR")}</Pill>}
      </div>

      <h3 className="mt-5 font-grotesk text-xl font-extrabold tracking-tight text-foreground">{p.nome}</h3>
      {p.descricao && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.descricao}</p>}

      <span className="focus-label mt-6 inline-flex items-center gap-1.5 text-foreground">
        {p.gratuito ? "Pegar agora" : "Quero este"}
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}

/* Placeholder no mesmo formato do card, para seção ainda sem produto. */
function CardEmBreve() {
  return (
    <div className="w-full h-full rounded-2xl border border-dashed border-border bg-card/40 p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl leading-none">🛠️</span>
        <Pill tom="sutil">Em breve</Pill>
      </div>
      <h3 className="mt-5 font-grotesk text-xl font-extrabold tracking-tight text-foreground">Em breve novos produtos</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Estamos preparando as próximas aplicações. Volte em alguns dias.
      </p>
      <span className="focus-label mt-6 inline-flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" /> Em desenvolvimento
      </span>
    </div>
  );
}

/* Advisor sem registro no banco — mantém o convite ao contato. */
function CardAdvisorPadrao() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-start sm:gap-5">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-background-elevated text-3xl">🧭</div>
      <div className="mt-4 flex-1 sm:mt-0">
        <h3 className="font-grotesk text-xl font-extrabold tracking-tight text-foreground">Advisor</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Uma conversa direta sobre a sua operação: o que travar, a gente organiza junto.
        </p>
        <Button
          size="sm"
          className="group mt-5 gap-1.5 rounded-full px-4"
          onClick={() => {
            registrarEvento("clique_produto", "advisor");
            window.location.href =
              "mailto:comercial@focusinteligente.com.br?subject=Quero%20falar%20com%20o%20Advisor";
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Falar comigo
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Central() {
  const { produtos, loading } = useProdutos();
  const [selecionado, setSelecionado] = useState<Produto | null>(null);

  useEffect(() => { registrarEvento("visita_catalogo"); }, []);

  const porTipo = (t: Produto["tipo"]) => produtos.filter((p) => p.tipo === t);

  return (
    <div data-theme="focus" className="focus-grid relative min-h-screen bg-background text-foreground">
      <PageMeta
        path="/"
        title="Templates e sistemas para sua operação"
        suffix="Hub Central"
        description="Templates de Notion, sistemas e consultoria para organizar a operação do seu negócio. Comece grátis, sem cadastro."
      />

      <AvisoHubAntigo />

      {/* Cabeçalho: só o logo, centralizado. No hover os nomes saem de trás dele. */}
      <header className="relative border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-5 flex justify-center">
          <div
            tabIndex={0}
            aria-label="Hub Central"
            className="group relative flex items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="pointer-events-none absolute right-1/2 whitespace-nowrap font-brand text-xl font-semibold text-foreground opacity-0 translate-x-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:-translate-x-9 group-focus-visible:opacity-100 group-focus-visible:-translate-x-9 motion-reduce:transition-none motion-reduce:-translate-x-9">
              Hub
            </span>
            <img
              src={logo}
              alt="Hub Central"
              className="relative z-10 h-16 w-16 rounded-2xl object-cover"
              width={64}
              height={64}
            />
            <span className="pointer-events-none absolute left-1/2 whitespace-nowrap font-brand text-xl font-semibold text-foreground opacity-0 translate-x-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-9 group-focus-visible:opacity-100 group-focus-visible:translate-x-9 motion-reduce:transition-none motion-reduce:translate-x-9">
              Central
            </span>
          </div>
        </div>
      </header>

      {!loading && (
        <AbasCatalogo abas={SECOES.map((s) => ({ tipo: s.tipo, rotulo: s.aba }))} />
      )}

      <main className="relative mx-auto max-w-5xl px-6 py-14 md:py-20">
        {/* Título centralizado; o complemento aparece no hover, sem empurrar layout. */}
        <div className="group mx-auto max-w-3xl text-center">
          <h1 className="font-grotesk text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-[-0.035em] text-foreground">
            Ferramentas pra organizar <span className="text-primary">sua operação</span>.
          </h1>
          <div className="mt-5 h-7">
            <p className="focus-label text-muted-foreground opacity-0 translate-y-1 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 motion-reduce:transition-none">
              / Pegue o que precisar, sem cadastro e sem custos
            </p>
          </div>
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
              const brutos = porTipo(s.tipo);
              // Só o primeiro marcado como destaque ganha o tratamento visual.
              const idDestaque = brutos.find((p) => p.destaque)?.id;
              const itens = brutos.map((p) => ({ ...p, destaque: p.id === idDestaque }));
              const ehAdvisor = s.tipo === "advisor";
              return (
                <section key={s.tipo} id={`secao-${s.tipo}`} className="scroll-mt-24">
                  <p className="focus-label text-muted-foreground">/ {s.sub}</p>
                  <h2 className="mt-2 font-grotesk text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-foreground">{s.titulo}</h2>
                  <Stagger
                    inView
                    gap={0.07}
                    className={`mt-6 grid gap-4 ${ehAdvisor ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
                  >
                    {itens.length === 0 ? (
                      <StaggerItem className="flex">
                        <div className="w-full flex">
                          {ehAdvisor ? <CardAdvisorPadrao /> : <CardEmBreve />}
                        </div>
                      </StaggerItem>
                    ) : (
                      itens.map((p) => (
                        <StaggerItem key={p.id} className="flex">
                          {ehAdvisor ? (
                            <div className="w-full"><CardAdvisor p={p} onAbrir={setSelecionado} /></div>
                          ) : (
                            <div className="w-full flex"><CardProduto p={p} onAbrir={setSelecionado} /></div>
                          )}
                        </StaggerItem>
                      ))
                    )}
                  </Stagger>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border/60 mt-8">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Plataforma criada pela{" "}
            <a
              href="https://focusinteligente.com.br"
              target="_blank" rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Focus
            </a>
          </p>
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
            <a href="https://focusinteligente.com.br" target="_blank" rel="noopener noreferrer" className="gap-1.5">
              Conhecer a Focus <ArrowRight className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </footer>

      <ProdutoDialog produto={selecionado} onOpenChange={(v) => !v && setSelecionado(null)} />
    </div>
  );
}
