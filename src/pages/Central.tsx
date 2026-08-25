import { useEffect, useState } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, PackageOpen, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import logoNotion from "@/assets/notion.png.asset.json";
import logoLovable from "@/assets/lovable-color.png.asset.json";
import { useProdutos, type Produto } from "@/hooks/useProdutos";
import { ProdutoDialog } from "@/components/central/ProdutoDialog";
import { AvisoHubAntigo } from "@/components/central/AvisoHubAntigo";
import { AbasCatalogo } from "@/components/central/AbasCatalogo";
import { FaqCatalogo } from "@/components/central/FaqCatalogo";
import { BotaoFeedbackFlutuante, LinkFeedback } from "@/components/central/BotaoFeedback";
import { FundoAnimado } from "@/components/central/FundoAnimado";
import { Stagger, StaggerItem } from "@/components/motion";
import { registrarEvento } from "@/lib/eventos";

// Hub Central — catálogo de produtos SEM LOGIN.
// Escada de compromisso: Notion grátis → Produtos Lovable → Advisor.
// As três seções aparecem sempre; sem produto no banco, entra um placeholder.

const SECOES: Array<{ tipo: Produto["tipo"]; titulo: string; sub: string; aba: string; logo?: string; fundoClaro?: boolean }> = [
  { tipo: "notion",  aba: "Notion",   titulo: "Templates Notion",  sub: "Gratuitos, prontos pra duplicar e usar hoje", logo: logoNotion.url, fundoClaro: true },
  { tipo: "lovable", aba: "Lovable",  titulo: "Produtos Lovable",  sub: "Aplicações completas pra operação do seu negócio", logo: logoLovable.url },
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
      className={`group relative w-full h-full text-left overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-background-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        p.destaque ? "border-primary/50" : "border-border"
      }`}
    >
      {/* A foto é o herói do card: o bloco se adapta à altura real da imagem,
          sem cortar nada. */}
      <div className="relative w-full bg-muted">
        {p.capa ? (
          <img
            src={p.capa}
            alt={p.nome}
            loading="lazy"
            className="block w-full h-auto"
          />
        ) : (
          <div className="aspect-[16/10] w-full bg-muted/40" />
        )}
        {p.destaque && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-background/85 p-0.5 backdrop-blur-sm">
            <Pill tom="primario">Recomendado</Pill>
          </span>
        )}

      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-grotesk text-lg font-extrabold leading-snug tracking-tight text-foreground">{p.nome}</h3>
          <span className="shrink-0">
            {p.gratuito ? <Pill tom="sutil">Grátis</Pill> : <Pill tom="sutil">R$ {Number(p.preco).toLocaleString("pt-BR")}</Pill>}
          </span>
        </div>


        {p.descricao && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.descricao}</p>}

        <span className="focus-label mt-4 inline-flex items-center gap-1.5 text-foreground">
          {p.gratuito ? "Pegar agora" : "Quero este"}
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}


/* Placeholder no mesmo formato do card, para seção ainda sem produto. */
function CardEmBreve() {
  return (
    <div className="w-full h-full rounded-2xl border border-dashed border-border bg-card/40 p-4">
      <div className="w-full rounded-xl border border-dashed border-border bg-muted/30 aspect-[16/10]" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="font-grotesk text-lg font-extrabold leading-snug tracking-tight text-foreground">Em breve novos produtos</h3>
        <Pill tom="sutil">Em breve</Pill>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        Estamos preparando as próximas aplicações. Volte em alguns dias.
      </p>
      <span className="focus-label mt-4 inline-flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" /> Em desenvolvimento
      </span>
    </div>
  );
}

/* Advisor ainda não está disponível — cartão apenas informativo, sem CTA. */
function CardAdvisorEmBreve() {
  return (
    <div className="flex flex-col rounded-2xl border border-dashed border-border bg-card/40 p-6 sm:flex-row sm:items-start sm:gap-5">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-background-elevated text-3xl">🧭</div>
      <div className="mt-4 flex-1 sm:mt-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-grotesk text-xl font-extrabold tracking-tight text-foreground">Advisor</h3>
          <Pill tom="sutil">Em breve</Pill>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Uma conversa direta sobre a sua operação: o que travar, a gente organiza junto.
          Estamos finalizando os detalhes — em breve por aqui.
        </p>
        <span className="focus-label mt-5 inline-flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" /> Em preparação
        </span>
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
    <div data-theme="focus" className="focus-grid relative min-h-screen overflow-hidden bg-background text-foreground">
      <FundoAnimado />
      <PageMeta
        path="/"
        title="Templates e sistemas para sua operação"
        suffix="Hub Central"
        description="Templates de Notion, sistemas e consultoria para organizar a operação do seu negócio. Comece grátis, sem cadastro."
      />

      <AvisoHubAntigo />

      {/* Cabeçalho: só o logo em repouso. No hover, "Hub" surge à esquerda,
          "Central" à direita e o micro-rótulo aparece abaixo. */}
      <header className="relative border-b border-border/60">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-7">
          <div
            tabIndex={0}
            aria-label="Hub Central"
            className="group flex flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="font-brand flex items-center justify-center gap-5 text-2xl font-semibold tracking-[-0.02em] md:text-[28px]">
              <span
                aria-hidden="true"
                className="wordmark-sheen w-[3.2em] text-right opacity-0 translate-x-3 transition-all duration-500 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
              >
                Hub
              </span>

              <span className="relative flex shrink-0 items-center justify-center">
                <span className="absolute h-20 w-20 rounded-full bg-primary/25 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70" />
                <img
                  src={logo}
                  alt="Hub Central"
                  className="relative z-10 h-[72px] w-[72px] rounded-2xl object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  width={72}
                  height={72}
                />
              </span>

              <span
                aria-hidden="true"
                className="w-[3.2em] text-left text-primary opacity-0 -translate-x-3 transition-all duration-500 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
              >
                Central
              </span>
            </div>

            <div className="h-5">
              <span className="focus-label text-muted-foreground opacity-0 -translate-y-1 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none">
                / by Focus Inteligente
              </span>
            </div>
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
                    {/* Advisor ainda não está no ar: seção sempre informativa. */}
                    {ehAdvisor || itens.length === 0 ? (
                      <StaggerItem className="flex">
                        <div className="w-full flex">
                          {ehAdvisor ? <CardAdvisorEmBreve /> : <CardEmBreve />}
                        </div>
                      </StaggerItem>
                    ) : (
                      itens.map((p) => (
                        <StaggerItem key={p.id} className="flex">
                          <div className="w-full flex"><CardProduto p={p} onAbrir={setSelecionado} /></div>
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

      <FaqCatalogo />

      <footer className="relative border-t border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="focus-label text-muted-foreground">
            / Plataforma criada pela{" "}
            <a
              href="https://focusinteligente.com.br"
              target="_blank" rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              Focus
            </a>
          </p>
          <div className="flex items-center gap-4">
            <LinkFeedback />
            <Button variant="ghost" size="sm" asChild className="focus-label h-7 rounded-full px-3">
              <a href="https://focusinteligente.com.br" target="_blank" rel="noopener noreferrer" className="gap-1.5">
                Conhecer a Focus <ArrowRight className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </div>
      </footer>

      <BotaoFeedbackFlutuante />

      <ProdutoDialog produto={selecionado} onOpenChange={(v) => !v && setSelecionado(null)} />
    </div>
  );
}
