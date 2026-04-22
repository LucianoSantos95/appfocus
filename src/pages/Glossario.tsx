import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const terms = [
  { term: "Pipeline de Vendas", def: "Sequência de etapas que um prospecto percorre até virar cliente. No Hub, cada nicho tem um pipeline pré-configurado (ex.: Briefing → Proposta → Produção → Entrega)." },
  { term: "CRM (Customer Relationship Management)", def: "Sistema para gerenciar relacionamento com clientes e prospectos. O Hub separa Prospectos de Clientes Ativos e usa IA para classificar e sugerir próximas ações." },
  { term: "Retainer", def: "Contrato de mensalidade fixa entre agência e cliente. É a categoria financeira mais usada por agências no Hub." },
  { term: "Time To Value (TTV)", def: "Tempo entre o cadastro e o primeiro valor real entregue ao usuário. O Hub mede e celebra cada marco do TTV com o WOW Moment." },
  { term: "Aha Moment", def: "Instante em que o usuário entende o valor do produto. No Hub, geralmente acontece ao ver o primeiro dashboard com dados reais." },
  { term: "DRE Simplificado", def: "Demonstração de Resultado do Exercício resumida: receitas menos despesas igual lucro. Disponível no BI Financeiro." },
  { term: "Ticket Médio", def: "Valor médio por venda ou contrato. Calculado automaticamente no BI Financeiro." },
  { term: "Inadimplência", def: "Receitas vencidas e não pagas. Indicador acompanhado em tempo real no BI." },
  { term: "Funil de Vendas", def: "Visualização das etapas comerciais e taxa de conversão entre elas. Disponível no módulo Marketing." },
  { term: "Kanban", def: "Quadro visual com cartões em colunas (a fazer, fazendo, feito). O módulo Tarefas usa Kanban com priorização." },
  { term: "Tool Calling (IA)", def: "Capacidade do assistente de IA de executar ações reais no sistema (criar tarefa, consultar cliente, gerar relatório). O Hub Assistant usa tool calling em todos os módulos." },
  { term: "RLS (Row Level Security)", def: "Mecanismo do banco de dados que garante que cada usuário só vê seus próprios dados. Aplicado em 100% das tabelas do Hub." },
  { term: "Onboarding", def: "Processo de primeiros passos do usuário. No Hub é guiado por IA com aplicação automática de templates por nicho." },
  { term: "Playbook", def: "Conjunto de processos documentados que padroniza a operação. Substitui o termo genérico 'manual' no contexto de agências." },
  { term: "Entrega", def: "Resultado tangível pactuado com o cliente (ex.: 4 posts, 1 relatório). Termo do Hub que substitui 'tarefa' no contexto de agência-cliente." },
  { term: "Equipe e Freelancers", def: "Modelo de time híbrido típico de agências: colaboradores fixos somados a freelancers por projeto. Suportado no módulo RH." },
  { term: "Lifetime Value (LTV)", def: "Receita total esperada de um cliente ao longo do relacionamento. Acompanhado no painel de assinantes." },
  { term: "Churn", def: "Taxa de cancelamento de clientes. Indicador-chave de saúde do negócio." },
];

export default function Glossario() {
  return (
    <div className="min-h-screen gradient-dark text-foreground">
      <Helmet>
        <title>Glossário de Gestão para Agências e Consultorias | Hub Empresarial</title>
        <meta name="description" content="Glossário completo com termos de gestão, CRM, finanças, marketing e operação para agências, consultorias, freelancers e pequenas empresas." />
        <link rel="canonical" href="https://appfocus.lovable.app/glossario" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          "name": "Glossário de Gestão para Agências",
          "hasDefinedTerm": terms.map((t) => ({
            "@type": "DefinedTerm",
            "name": t.term,
            "description": t.def,
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
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Glossário de Gestão</h1>
        <p className="text-muted-foreground mb-10">
          Termos essenciais de gestão para agências, consultorias e pequenas empresas — explicados de forma simples.
        </p>

        <dl className="space-y-6">
          {terms.map((t) => (
            <div key={t.term} className="border-l-2 border-primary/40 pl-4">
              <dt className="font-semibold text-foreground mb-1">{t.term}</dt>
              <dd className="text-sm text-muted-foreground">{t.def}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
