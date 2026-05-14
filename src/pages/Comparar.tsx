import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const rows = [
  { feature: "Foco em agências e consultorias BR", hub: true, planilhas: false, trello: false, erp: false },
  { feature: "Onboarding guiado por IA", hub: true, planilhas: false, trello: false, erp: false },
  { feature: "Templates por nicho (pipeline, tarefas, categorias)", hub: true, planilhas: false, trello: false, erp: false },
  { feature: "Finanças + CRM + Projetos integrados", hub: true, planilhas: false, trello: false, erp: true },
  { feature: "Relatórios prontos para cliente (PDF/E-mail/WhatsApp)", hub: true, planilhas: false, trello: false, erp: false },
  { feature: "Assistente de IA com tool calling", hub: true, planilhas: false, trello: false, erp: false },
  { feature: "Importação de extratos OFX", hub: true, planilhas: false, trello: false, erp: true },
  { feature: "Preço acessível (a partir de R$69)", hub: true, planilhas: true, trello: true, erp: false },
  { feature: "100% em português brasileiro", hub: true, planilhas: true, trello: false, erp: true },
  { feature: "Sem necessidade de TI para configurar", hub: true, planilhas: true, trello: true, erp: false },
];

const Cell = ({ value }: { value: boolean }) => (
  value
    ? <Check className="w-5 h-5 text-primary mx-auto" />
    : <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
);

export default function Comparar() {
  return (
    <div className="min-h-screen gradient-dark text-foreground">
      <Helmet>
        <title>Hub Empresarial vs Planilhas, Trello e ERPs | Comparativo</title>
        <meta name="description" content="Compare o Hub Empresarial com planilhas, Trello/Notion e ERPs tradicionais. Veja por que agências, consultorias e PMEs escolhem o Hub para gestão integrada." />
        <link rel="canonical" href="https://app.focusinteligente.com.br/comparar" />
        <meta property="og:title" content="Hub Empresarial vs Planilhas, Trello e ERPs | Comparativo" />
        <meta property="og:description" content="Compare o Hub Empresarial com planilhas, Trello/Notion e ERPs tradicionais. Veja por que agências, consultorias e PMEs escolhem o Hub." />
        <meta property="og:url" content="https://app.focusinteligente.com.br/comparar" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Hub Empresarial vs Planilhas, Trello e ERPs",
          "description": "Comparativo entre o Hub Empresarial e ferramentas alternativas de gestão para agências, consultorias e pequenas empresas.",
          "author": { "@type": "Organization", "name": "Focus Inteligente" },
          "publisher": { "@type": "Organization", "name": "Focus Inteligente" },
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

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Hub Empresarial <span className="gradient-text">vs alternativas</span>
        </h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          Por que agências, consultorias e pequenas empresas estão migrando de planilhas, Trello e ERPs para o Hub Empresarial.
        </p>

        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left p-4 font-semibold">Recurso</th>
                <th className="p-4 font-semibold text-primary">Hub Empresarial</th>
                <th className="p-4 font-semibold">Planilhas</th>
                <th className="p-4 font-semibold">Trello/Notion</th>
                <th className="p-4 font-semibold">ERP tradicional</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-t border-border/50">
                  <td className="p-4 text-foreground">{row.feature}</td>
                  <td className="p-4"><Cell value={row.hub} /></td>
                  <td className="p-4"><Cell value={row.planilhas} /></td>
                  <td className="p-4"><Cell value={row.trello} /></td>
                  <td className="p-4"><Cell value={row.erp} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <h2 className="text-xl font-bold mb-2">Pronto para profissionalizar sua operação?</h2>
          <p className="text-muted-foreground mb-4">7 dias grátis. Sem cartão de crédito.</p>
          <Button asChild className="btn-hero text-foreground"><Link to="/auth">Começar agora</Link></Button>
        </div>
      </main>
    </div>
  );
}
