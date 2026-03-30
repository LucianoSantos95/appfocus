import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Como começar a usar o Hub Empresarial?",
    answer: "Comece cadastrando seus clientes e projetos da agência. Depois, registre suas contas bancárias e primeiras movimentações. O sistema irá calcular automaticamente seus indicadores.",
  },
  {
    question: "Quais são as limitações da versão Free?",
    answer: "A versão Free permite gerenciar até 50 registros por módulo, sem relatórios avançados ou automações. Ideal para validar o sistema antes de escalar sua operação.",
  },
  {
    question: "O que está incluso no Hub Empresarial Pro?",
    answer: "Relatórios para apresentar a clientes, automações de operação, integrações com outros sistemas, suporte prioritário e limites expandidos de registros.",
  },
  {
    question: "Posso exportar meus dados?",
    answer: "Sim, todos os módulos permitem exportação em CSV e Excel. A versão Pro também oferece relatórios em PDF — perfeitos para apresentar resultados a clientes.",
  },
  {
    question: "Como funciona a segurança dos dados?",
    answer: "Utilizamos criptografia de ponta a ponta e backups diários. Seus dados são armazenados em servidores seguros com certificação ISO 27001.",
  },
  {
    question: "Posso adicionar mais membros da equipe?",
    answer: "Na versão Free você pode ter 1 usuário. A versão Pro permite membros ilimitados com diferentes níveis de permissão para sua equipe e freelancers.",
  },
];

export function FAQSection() {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-premium">
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Perguntas Frequentes</h3>
      </div>
      <div className="p-4">
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/50 rounded-lg px-4 data-[state=open]:bg-muted/30"
            >
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-3">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
