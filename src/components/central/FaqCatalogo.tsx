import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// FAQ curto do catálogo — no máximo 5 perguntas, logo acima do rodapé.
const PERGUNTAS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "Preciso criar conta para usar?",
    a: "Não. O catálogo é aberto: você escolhe o que quer, deixa nome e e-mail e recebe o acesso na hora.",
  },
  {
    q: "Os templates de Notion são realmente gratuitos?",
    a: "São. Os templates marcados como Grátis não têm custo nem assinatura — é só duplicar para o seu Notion e usar.",
  },
  {
    q: "Como recebo o template depois de preencher nome e e-mail?",
    a: "O link de acesso abre na hora, assim que você envia o formulário. O e-mail serve só para avisarmos de atualizações e novos materiais.",
  },
  {
    q: "O que é o Advisor?",
    a: "É uma conversa direta sobre a sua operação: a gente olha o que está travando e organiza junto. Está em preparação e chega em breve.",
  },
  {
    q: "O que vocês fazem com os meus dados?",
    a: (
      <>
        Guardamos apenas nome e e-mail, para envio dos materiais. Você pode pedir a exclusão
        quando quiser. Detalhes na{" "}
        <Link to="/privacidade" className="text-foreground underline underline-offset-4 hover:text-primary">
          política de privacidade
        </Link>
        .
      </>
    ),
  },
];

export function FaqCatalogo() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 pb-16 scroll-mt-24">
      <p className="focus-label text-muted-foreground">/ Dúvidas rápidas</p>
      <h2 className="mt-2 font-grotesk text-3xl font-extrabold tracking-[-0.03em] text-foreground">
        Perguntas frequentes
      </h2>

      <Accordion type="single" collapsible className="mt-6">
        {PERGUNTAS.map((p, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-border">
            <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
              {p.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {p.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
