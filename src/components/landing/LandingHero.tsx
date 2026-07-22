import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import InteractivePanel from "./InteractivePanel";
import { FadeIn } from "@/components/motion";

interface Props {
  onSignup: () => void;
  onDemo: () => void;
  demoLoading: boolean;
}

export default function LandingHero({ onSignup, onDemo, demoLoading }: Props) {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        <FadeIn>
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Gestão com IA · Feito no Brasil
            </span>

            <h1 className="mt-5 text-4xl md:text-5xl xl:text-6xl leading-[1.05] tracking-tight text-foreground font-semibold">
              Um Hub pra substituir suas{" "}
              <span className="font-display italic font-normal text-accent">6 ferramentas</span>{" "}
              de gestão.
            </h1>

            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Finanças, clientes, projetos e relatórios num lugar só — conectado ao seu Google,
              WhatsApp e até ao ChatGPT. Pare de pular entre planilha, Trello e CRM.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={onSignup}
                className="group h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5 shadow-premium font-semibold"
              >
                Começar grátis
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onDemo}
                disabled={demoLoading}
                className="group h-12 px-6 text-foreground hover:bg-secondary transition-all hover:-translate-y-0.5"
              >
                <PlayCircle className="w-4 h-4 mr-2 text-accent" />
                {demoLoading ? "Entrando…" : "Ver demo ao vivo"}
              </Button>
            </div>

            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Sem cartão · plano grátis pra sempre · cancele quando quiser
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <InteractivePanel />
        </FadeIn>
      </div>
    </section>
  );
}
