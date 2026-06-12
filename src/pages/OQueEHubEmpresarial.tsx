import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const beneficios = [
  "Centraliza finanças, CRM, projetos, marketing, RH e processos em um só lugar",
  "Elimina planilhas avulsas e ferramentas fragmentadas (Trello, Notion, ERPs caros)",
  "Padroniza a operação de agências, consultorias e PMEs com templates por nicho",
  "Oferece relatórios prontos para enviar ao cliente em PDF, e-mail ou WhatsApp",
  "Reduz tempo de configuração com onboarding guiado por IA",
];

const faq = [
  {
    q: "O que é um Hub Empresarial?",
    a: "Um Hub Empresarial é uma plataforma única que reúne todos os módulos essenciais de gestão de uma pequena ou média empresa — financeiro, clientes, projetos, tarefas, marketing, RH e processos — substituindo planilhas e ferramentas isoladas.",
  },
  {
    q: "Para quem é o Hub Empresarial?",
    a: "Para agências de marketing, consultorias, freelancers e pequenas empresas que precisam profissionalizar a operação sem o custo e a complexidade de um ERP tradicional.",
  },
  {
    q: "Qual a diferença entre Hub Empresarial e ERP?",
    a: "ERPs tradicionais são caros, exigem TI e levam meses para configurar. Um Hub Empresarial é leve, 100% web, configurável em minutos e voltado a operações de serviço (não a indústria/estoque).",
  },
  {
    q: "Quanto custa o Hub Empresarial da Focus Inteligente?",
    a: "Os planos começam em R$69/mês, com 7 dias grátis sem necessidade de cartão de crédito.",
  },
];

export default function OQueEHubEmpresarial() {
  return (
    <div className="min-h-screen gradient-dark text-foreground">
      <Helmet>
        <title>O que é Hub Empresarial? Guia completo para PMEs | Focus Inteligente</title>
        <meta
          name="description"
          content="Hub Empresarial é a plataforma única que centraliza finanças, CRM, projetos, marketing e RH de PMEs e agências. Entenda o conceito, benefícios e diferenças vs ERP."
        />
        <link rel="canonical" href="https://app.focusinteligente.com.br/blog/o-que-e-hub-empresarial" />
        <meta property="og:title" content="O que é Hub Empresarial? Guia completo para PMEs" />
        <meta
          property="og:description"
          content="Hub Empresarial centraliza finanças, CRM, projetos, marketing e RH em uma única plataforma. Conceito, benefícios e comparativo com ERP."
        />
        <meta property="og:url" content="https://app.focusinteligente.com.br/blog/o-que-e-hub-empresarial" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "O que é Hub Empresarial? Guia completo para PMEs",
          description:
            "Conceito, benefícios e diferenças entre Hub Empresarial e ERPs tradicionais para agências, consultorias e pequenas empresas.",
          inLanguage: "pt-BR",
          author: { "@type": "Organization", name: "Focus Inteligente" },
          publisher: { "@type": "Organization", name: "Focus Inteligente" },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}</script>
      </Helmet>

      <header className="border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg gradient-text">Hub Empresarial</Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <article>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            O que é um <span className="gradient-text">Hub Empresarial</span>?
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Um Hub Empresarial é a plataforma única que centraliza todos os módulos
            de gestão de uma pequena ou média empresa — finanças, clientes, projetos,
            tarefas, marketing, RH e processos — em uma só ferramenta, no lugar de
            dezenas de planilhas e ferramentas isoladas.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Por que PMEs e agências adotam um Hub Empresarial</h2>
          <p className="text-muted-foreground mb-4">
            A operação de uma agência de marketing, consultoria ou pequena empresa
            costuma ficar espalhada entre planilhas, Trello, WhatsApp, e-mail e
            ferramentas avulsas de cobrança. Isso gera retrabalho, perda de prazos
            e zero visibilidade sobre o negócio. Um Hub Empresarial resolve esse
            problema reunindo tudo em uma única base de dados integrada.
          </p>
          <ul className="space-y-3 my-6">
            {beneficios.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">Hub Empresarial vs ERP tradicional</h2>
          <p className="text-muted-foreground mb-4">
            ERPs como SAP, TOTVS ou Sankhya foram desenhados para indústrias e grandes
            empresas, exigem consultoria de implantação e custam milhares por mês. Um
            Hub Empresarial moderno é leve, 100% web, focado em operações de serviço
            e pode ser configurado em minutos — sem TI dedicada.
          </p>
          <p className="text-muted-foreground mb-4">
            Compare em detalhe na nossa página{" "}
            <Link to="/comparar" className="text-primary underline">Hub Empresarial vs Planilhas, Trello e ERPs</Link>.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Quais módulos um bom Hub Empresarial precisa ter</h2>
          <p className="text-muted-foreground mb-4">
            No mínimo: <strong>Financeiro</strong> (contas, transações, importação OFX),{" "}
            <strong>Clientes/CRM</strong> (pipeline, follow-ups, notas de reunião),{" "}
            <strong>Projetos</strong> (prazos, anexos, orçamentos),{" "}
            <strong>Tarefas</strong> (Kanban com prioridades),{" "}
            <strong>Marketing</strong> (calendário de conteúdo e campanhas),{" "}
            <strong>RH</strong> (colaboradores, documentos, férias) e{" "}
            <strong>Processos</strong> (playbooks e fluxos documentados).
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">Perguntas frequentes</h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="rounded-lg border border-border/50 p-4">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
            <h2 className="text-xl font-bold mb-2">Experimente o Hub Empresarial da Focus Inteligente</h2>
            <p className="text-muted-foreground mb-4">7 dias grátis. Sem cartão de crédito.</p>
            <Button asChild className="btn-hero text-foreground"><Link to="/auth">Começar agora</Link></Button>
          </div>
        </article>
      </main>
    </div>
  );
}
