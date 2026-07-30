import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { useState } from "react";
import { CustomizeDialog } from "@/components/customize/CustomizeDialog";

// O Hub é 100% gratuito — esta seção deixou de vender planos e passou a
// comunicar a gratuidade + captar pedidos de customização.
// A âncora #precos foi preservada porque o menu da landing aponta pra ela.

interface Props {
  onSignup: () => void;
}

const INCLUSO = [
  "Registros ilimitados em todos os módulos",
  "Finanças, CRM, Projetos, Atividades, RH, Marketing e Processos",
  "Relatórios, exportações e dashboards de BI",
  "Análises e assistente de IA",
  "Integrações com Google, WhatsApp e Slack",
  "Servidor MCP — use o Hub no ChatGPT e Claude",
  "Usuários da sua equipe",
  "Atualizações e suporte",
];

export default function PricingSection({ onSignup }: Props) {
  const [customizeOpen, setCustomizeOpen] = useState(false);

  return (
    <section id="precos" className="py-20 md:py-28 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-medium">
              Sem planos · sem cartão
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              O Hub inteiro é{" "}
              <span className="font-display italic font-normal text-accent">gratuito</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Não existe versão paga nem recurso bloqueado. Tudo o que você vê aqui está
              liberado desde o primeiro dia.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid lg:grid-cols-5 gap-6 items-start">
          {/* O que está incluso */}
          <FadeIn className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-foreground font-mono tabular-nums">R$ 0</span>
                <span className="text-sm text-muted-foreground">para sempre</span>
              </div>
              <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {INCLUSO.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={onSignup}
                className="group mt-7 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 transition-all hover:-translate-y-0.5"
              >
                Começar grátis
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </FadeIn>

          {/* Customização — o único CTA de conversão do produto */}
          <FadeIn className="lg:col-span-2">
            <div className="rounded-2xl border border-accent/30 bg-card p-6 md:p-8 flex flex-col h-full transition-all hover:-translate-y-1 hover:border-accent/60">
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-wider px-2.5 py-1">
                <Sparkles className="w-3 h-3" /> Sob medida
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Falta algo pra sua operação?</h3>
              <p className="mt-2 text-sm text-muted-foreground flex-1">
                Cada negócio tem um detalhe que nenhum sistema pronto resolve. Conte o que é —
                a gente estuda construir sob medida pra você.
              </p>
              <Button
                onClick={() => setCustomizeOpen(true)}
                variant="secondary"
                className="group mt-6 w-full transition-all hover:-translate-y-0.5"
              >
                Quero o Hub do meu jeito
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>

      <CustomizeDialog open={customizeOpen} onOpenChange={setCustomizeOpen} origem="landing" />
    </section>
  );
}
