import { DollarSign, Users, FolderKanban, CheckSquare, Megaphone, UserCog } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const modules = [
  { icon: DollarSign, title: "Finanças", desc: "Feche o mês em minutos" },
  { icon: Users, title: "Clientes", desc: "Nunca perca um follow-up" },
  { icon: FolderKanban, title: "Projetos", desc: "Entregue no prazo" },
  { icon: CheckSquare, title: "Tarefas", desc: "Organize a rotina" },
  { icon: Megaphone, title: "Marketing", desc: "Planeje o conteúdo" },
  { icon: UserCog, title: "RH · Processos", desc: "Padronize a casa" },
];

export default function ModulesGrid() {
  return (
    <section id="modulos" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-medium">
              Módulos como resultado
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Cada módulo resolve uma{" "}
              <span className="font-display italic font-normal text-accent">dor real</span>.
            </h2>
          </div>
        </FadeIn>

        <Stagger className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <StaggerItem key={m.title}>
              <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <m.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
