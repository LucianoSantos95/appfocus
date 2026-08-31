import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { useProdutos, type Produto } from "@/hooks/useProdutos";
import { ProdutoDialog } from "@/components/central/ProdutoDialog";
import logoEmail from "@/assets/logo-email.png";

// Landing dedicada à intenção de busca "template notion gratuito".
// Reaproveita o catálogo real (produtos tipo=notion e gratuito=true) e o
// mesmo dialog de captura usado no Hub Central.
export default function TemplatesNotionGratuitos() {
  const { produtos, loading } = useProdutos();
  const [selecionado, setSelecionado] = useState<Produto | null>(null);

  const itens = useMemo(
    () =>
      produtos
        .filter((p) => p.tipo === "notion" && p.gratuito)
        .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0) || a.ordem - b.ordem),
    [produtos]
  );

  return (
    <div data-theme="focus" className="min-h-screen bg-background text-foreground">
      <PageMeta
        path="/templates-notion-gratuitos"
        title="Templates de Notion gratuitos para organizar seu negócio"
        suffix="Hub Central"
        description="Baixe templates de Notion gratuitos e prontos para duplicar: financeiro, projetos, clientes e rotina. Sem cadastro complicado, direto no seu Notion."
      />

      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link to="/" className="focus-label inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Hub Central
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="focus-label text-muted-foreground">/ Gratuitos, prontos pra duplicar e usar hoje</p>
        <h1 className="mt-3 font-grotesk text-4xl md:text-5xl font-extrabold tracking-[-0.03em]">
          Templates de Notion gratuitos
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Modelos que a Focus usa na prática para organizar operação de pequenos negócios: controle
          financeiro, projetos, clientes e rotina da semana. Você duplica no seu Notion e começa a
          usar no mesmo dia — sem mensalidade e sem precisar criar conta aqui.
        </p>

        <section className="mt-10">
          <h2 className="font-grotesk text-2xl font-bold tracking-tight">Templates disponíveis</h2>

          {loading ? (
            <p className="mt-6 text-muted-foreground">Carregando templates…</p>
          ) : itens.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              Nenhum template gratuito publicado no momento. Veja o catálogo completo no{" "}
              <Link to="/" className="text-primary underline">Hub Central</Link>.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-[1200/630] w-full overflow-hidden bg-white">
                    {p.capa ? (
                      <img
                        src={p.capa}
                        alt={`Capa do template de Notion ${p.nome}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <img src={logoEmail} alt="" aria-hidden="true" className="h-8 object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="font-grotesk text-lg font-extrabold leading-snug tracking-tight">
                      {p.nome}
                    </h3>
                    {p.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{p.descricao}</p>
                    )}
                    <Button className="mt-auto rounded-full" onClick={() => setSelecionado(p)}>
                      Pegar agora
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-grotesk text-2xl font-bold tracking-tight">Como usar um template do Notion</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Escolha o template e informe nome e e-mail para receber o link.</li>
            <li>Abra o link no navegador com sua conta do Notion logada.</li>
            <li>Clique em "Duplicar" no canto superior direito da página.</li>
            <li>Adapte as categorias e comece a preencher com os dados do seu negócio.</li>
          </ol>
          <p className="mt-5 text-muted-foreground">
            Precisa de mais do que um template?{" "}
            <Link to="/" className="text-primary underline">
              Veja os playbooks e sistemas do Hub Central
            </Link>
            .
          </p>
        </section>
      </main>

      <ProdutoDialog produto={selecionado} onOpenChange={(o) => !o && setSelecionado(null)} />
    </div>
  );
}
