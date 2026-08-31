import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FeedbackDialog } from "@/components/user/FeedbackDialog";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, PackageOpen, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import focusWordmark from "@/assets/logo-email.png";
import logoNotion from "@/assets/notion.png.asset.json";
import logoLovable from "@/assets/lovable-color.png.asset.json";
import { useProdutos, type Produto } from "@/hooks/useProdutos";
import { ProdutoDialog } from "@/components/central/ProdutoDialog";
import { AvisoHubAntigo } from "@/components/central/AvisoHubAntigo";
import { AbasCatalogo } from "@/components/central/AbasCatalogo";
import { FaqCatalogo } from "@/components/central/FaqCatalogo";
import { BotaoFeedbackFlutuante } from "@/components/central/BotaoFeedback";
import { LinkSuporte } from "@/components/central/SuporteDialog";
import { FundoAnimado } from "@/components/central/FundoAnimado";
import { Stagger, StaggerItem } from "@/components/motion";
import { BorderBeam } from "@/components/magicui/border-beam";

import { registrarEvento } from "@/lib/eventos";

// Hub Central — catálogo de produtos SEM LOGIN.
// Escada de compromisso: Notion grátis → Produtos Lovable → Advisor.
// As três seções aparecem sempre; sem produto no banco, entra um placeholder.

const SECOES: Array<{ tipo: Produto["tipo"]; titulo: string; sub: string; aba: string; logo?: string; fundoClaro?: boolean }> = [
  { tipo: "notion",  aba: "Notion",   titulo: "Templates Notion",  sub: "Gratuitos, prontos pra duplicar e usar hoje", logo: logoNotion.url, fundoClaro: true },
  { tipo: "playbook", aba: "Playbooks", titulo: "Playbooks", sub: "Metodologia pronta pra organizar sua operação, passo a passo" },
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

  // O Advisor é enquete, não produto pra pegar: merece o mesmo brilho do card
  // recomendado, mas com um selo que faça sentido pro contexto.
  const advisor = p.tipo === "advisor";
  const comBeam = p.destaque || advisor;

  return (
    <button
      onClick={acao}
      className={`group relative w-full h-full text-left overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-background-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        comBeam ? "border-primary/50" : "border-border"
      }`}
    >
      {/* Luz sutil percorrendo o contorno — card recomendado e Advisor. */}
      {comBeam && <BorderBeam />}

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
          /* Sem capa: wordmark da Focus centralizada, na mesma proporção das
             capas reais (1200x630) — o card fica com a mesma altura dos vizinhos.
             O fundo claro imita uma capa de verdade e mantém a wordmark legível
             nos dois temas. */
          <div
            className="flex aspect-[1200/630] w-full items-center justify-center"
            style={{ backgroundColor: "hsl(0 0% 100%)" }}
          >
            <img src={focusWordmark} alt="Focus Inteligente" loading="lazy" className="h-10 w-auto sm:h-12" />
          </div>
        )}
        {comBeam && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-background/85 p-0.5 backdrop-blur-sm">
            <Pill tom="primario">{advisor ? "Sua opinião conta" : "Recomendado"}</Pill>
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

const PAGINA = 3;

/* Uma seção do catálogo: ordena (destaque primeiro, depois mais baixados)
   e revela 3 itens por vez. */
function SecaoCatalogo({
  s,
  itens,
  onAbrir,
}: {
  s: (typeof SECOES)[number];
  itens: Produto[];
  onAbrir: (p: Produto) => void;
}) {
  const [visiveis, setVisiveis] = useState(PAGINA);
  const ehAdvisor = s.tipo === "advisor";

  // Só o primeiro marcado como destaque ganha o tratamento visual.
  const idDestaque = itens.find((p) => p.destaque)?.id;
  const ordenados = itens
    .map((p) => ({ ...p, destaque: p.id === idDestaque }))
    .sort((a, b) => {
      if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
      const d = (b.downloads ?? 0) - (a.downloads ?? 0);
      return d !== 0 ? d : a.ordem - b.ordem;
    });

  const mostrando = ordenados.slice(0, visiveis);
  const restantes = ordenados.length - mostrando.length;

  return (
    <section id={`secao-${s.tipo}`} className="group scroll-mt-24">
      <p className="focus-label text-muted-foreground">/ {s.sub}</p>
      <h2 className="mt-2 flex items-center gap-3 font-grotesk text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-foreground">
        {s.titulo}
        {s.logo && (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center md:h-9 md:w-9">
            <img
              src={s.logo}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className={`h-full w-full object-contain opacity-0 -translate-x-2 scale-90 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none ${
                s.fundoClaro ? "rounded-md bg-white p-1" : ""
              }`}
            />
          </span>
        )}
      </h2>
      <Stagger
        inView
        gap={0.07}
        className={`mt-6 grid gap-4 ${ehAdvisor && ordenados.length === 0 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
      >
        {/* Advisor só mostra "Em breve" quando não há produto cadastrado. */}
        {ordenados.length === 0 ? (
          <StaggerItem className="flex">
            <div className="w-full flex">{ehAdvisor ? <CardAdvisorEmBreve /> : <CardEmBreve />}</div>
          </StaggerItem>
        ) : (
          mostrando.map((p) => (
            <StaggerItem key={p.id} className="flex">
              <div className="w-full flex">
                <CardProduto p={p} onAbrir={onAbrir} />
              </div>
            </StaggerItem>
          ))
        )}
      </Stagger>

      {restantes > 0 && (
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisiveis((v) => v + PAGINA)}
            className="focus-label rounded-full"
          >
            Ver mais ({restantes})
          </Button>
        </div>
      )}

      {s.tipo === "notion" && (
        <p className="mt-5 text-sm text-muted-foreground">
          <Link to="/templates-notion-gratuitos" className="text-primary underline underline-offset-4">
            Ver todos os templates de Notion gratuitos
          </Link>
        </p>
      )}
    </section>
  );
}

export default function Central() {
  const { produtos, loading } = useProdutos();
  const [selecionado, setSelecionado] = useState<Produto | null>(null);
  const [avaliando, setAvaliando] = useState<Produto | null>(null);
  
  const [params, setParams] = useSearchParams();

  useEffect(() => { registrarEvento("visita_catalogo"); }, []);

  // Link vindo do e-mail de agradecimento: /?avaliar={slug} abre o feedback
  // já no contexto do produto certo.
  const slugAvaliar = params.get("avaliar");
  useEffect(() => {
    if (!slugAvaliar || produtos.length === 0) return;
    const p = produtos.find((x) => x.slug === slugAvaliar);
    if (p) setAvaliando(p);
    const next = new URLSearchParams(params);
    next.delete("avaliar");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugAvaliar, produtos]);

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
            Ferramentas pra organizar <span className="gradient-text-animado">sua operação</span>.
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
            {SECOES.map((s) => (
              <SecaoCatalogo key={s.tipo} s={s} itens={porTipo(s.tipo)} onAbrir={setSelecionado} />
            ))}
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
            <LinkSuporte />
          </div>
        </div>
      </footer>

      <BotaoFeedbackFlutuante />

      <ProdutoDialog produto={selecionado} onOpenChange={(v) => !v && setSelecionado(null)} />

      <FeedbackDialog
        open={!!avaliando}
        onOpenChange={(v) => !v && setAvaliando(null)}
        pagina={avaliando?.slug}
        placeholder={avaliando ? `Como foi usar o ${avaliando.nome}? Conta pra gente.` : undefined}
      />
    </div>
  );
}
