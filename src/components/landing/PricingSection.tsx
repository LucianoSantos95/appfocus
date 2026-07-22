import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/motion";
import { useState } from "react";

interface Props {
  onSignup: () => void;
}

const plans = [
  {
    name: "Grátis",
    monthly: 0,
    annual: 0,
    cadenceMonthly: "para sempre",
    cadenceAnnual: "para sempre",
    highlight: false,
    features: ["Até 10 registros/módulo", "1 usuário", "MCP incluso", "Sem cartão"],
    cta: "Começar grátis",
    action: "signup" as const,
  },
  {
    name: "Plus",
    monthly: 69,
    annual: 55,
    cadenceMonthly: "/mês",
    cadenceAnnual: "/mês · anual",
    highlight: true,
    badge: "Mais popular",
    features: ["Registros ilimitados", "5 usuários", "Integrações Google + WhatsApp", "Suporte prioritário"],
    cta: "Assinar Plus",
    action: "planos" as const,
    planId: "plus" as const,
  },
  {
    name: "Pro",
    monthly: 149,
    annual: 119,
    cadenceMonthly: "/mês",
    cadenceAnnual: "/mês · anual",
    highlight: false,
    features: ["IA + exports ilimitados", "10 usuários", "Relatórios personalizados", "Automações avançadas"],
    cta: "Assinar Pro",
    action: "planos" as const,
  },
  {
    name: "Enterprise",
    monthly: 297,
    annual: 237,
    cadenceMonthly: "/mês",
    cadenceAnnual: "/mês · anual",
    highlight: false,
    features: ["Ilimitado tudo", "Usuários ilimitados", "SLA + suporte dedicado", "Onboarding assistido"],
    cta: "Falar com vendas",
    action: "planos" as const,
  },
];

export default function PricingSection({ onSignup }: Props) {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);


  return (
    <section id="precos" className="py-20 md:py-28 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-medium">
              Preços transparentes
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Comece grátis. Escale{" "}
              <span className="font-display italic font-normal text-accent">quando faz sentido</span>.
            </h2>
          </div>
        </FadeIn>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                !annual ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
                annual ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                annual ? "bg-accent-foreground/15" : "bg-accent/15 text-accent"
              }`}>-20%</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => {
            const price = annual ? p.annual : p.monthly;
            const cadence = annual ? p.cadenceAnnual : p.cadenceMonthly;
            return (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all hover:-translate-y-1 ${
                p.highlight
                  ? "border-accent bg-card shadow-elegant"
                  : "border-border bg-card hover:border-accent/40"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                  {p.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-foreground font-mono tabular-nums">R$ {price}</span>
                <span className="text-xs text-muted-foreground">{cadence}</span>
              </div>

              <ul className="mt-5 space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => (p.action === "signup" ? onSignup() : navigate("/planos"))}
                className={`group mt-6 w-full transition-all hover:-translate-y-0.5 ${
                  p.highlight
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {p.cta}
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
