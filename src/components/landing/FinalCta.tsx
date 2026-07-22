import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { FadeIn } from "@/components/motion";

interface Props {
  onSignup: () => void;
  onDemo: () => void;
  demoLoading: boolean;
}

export default function FinalCta({ onSignup, onDemo, demoLoading }: Props) {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5 p-10 md:p-16 text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
                Sua operação organizada{" "}
                <span className="font-display italic font-normal text-accent">ainda hoje</span>.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                Setup em 2 minutos. Sem cartão. Grátis pra sempre até 10 registros por módulo.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
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
                  className="h-12 px-6 text-foreground hover:bg-secondary transition-all hover:-translate-y-0.5"
                >
                  <PlayCircle className="w-4 h-4 mr-2 text-accent" />
                  {demoLoading ? "Entrando…" : "Ver demo ao vivo"}
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
