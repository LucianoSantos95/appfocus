import { X } from "lucide-react";
import { FadeIn } from "@/components/motion";

const items = [
  "Planilhas Excel / Sheets",
  "Trello / Asana",
  "Pipedrive / CRM avulso",
  "Financeiro isolado",
  "RH separado",
  "Relatórios feitos na unha",
];

export default function ReplacesSection() {
  return (
    <section id="por-que" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <FadeIn>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-medium">
            Substitui tudo isso
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            1 Hub.{" "}
            <span className="font-display italic font-normal text-accent">6 assinaturas</span>{" "}
            a menos.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Toda gestão da sua operação em um só lugar. Chega de exportar CSV e conciliar dados na mão.
          </p>
        </FadeIn>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
          {items.map((it) => (
            <div
              key={it}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-destructive/40"
            >
              <span className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4 text-destructive" />
              </span>
              <span className="text-sm text-muted-foreground line-through decoration-destructive/60 decoration-2">
                {it}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
