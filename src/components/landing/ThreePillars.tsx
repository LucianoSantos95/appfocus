import { Layers, Bot, Plug } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const pillars = [
  {
    icon: Layers,
    title: "Tudo integrado",
    desc: "Dados cruzam entre módulos. Fechou uma venda no CRM? Já vira receita nas finanças e tarefa na entrega.",
  },
  {
    icon: Bot,
    title: "IA que trabalha",
    desc: "Classifica clientes, enriquece empresas, fecha relatórios e sugere ações — sem você abrir o ChatGPT em outra aba.",
  },
  {
    icon: Plug,
    title: "Conecta seu stack",
    desc: "Google Agenda, Gmail, WhatsApp e Slack. Notificações e agendamentos direto do Hub, sem retrabalho.",
  },
];

export default function ThreePillars() {
  return (
    <section className="py-20 md:py-28 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-medium">
              Por que é diferente
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Não é mais um app. É o{" "}
              <span className="font-display italic font-normal text-accent">cérebro</span>{" "}
              da operação.
            </h2>
          </div>
        </FadeIn>

        <Stagger className="mt-14 grid md:grid-cols-3 gap-5">
          {pillars.map((p) => (
            <StaggerItem key={p.title}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
