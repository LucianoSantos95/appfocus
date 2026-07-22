import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/motion";

interface Props {
  onSignup: () => void;
}

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    cadence: "para sempre",
    highlight: false,
    features: ["Até 10 registros/módulo", "1 usuário", "MCP incluso", "Sem cartão"],
    cta: "Começar grátis",
    action: "signup" as const,
  },
  {
    name: "Plus",
    price: "R$ 69",
    cadence: "/mês",
    highlight: true,
    badge: "Mais popular",
    features: ["Registros ilimitados", "5 usuários", "Integrações Google + WhatsApp", "Suporte prioritário"],
    cta: "Assinar Plus",
    action: "planos" as const,
  },
  {
    name: "Pro",
    price: "R$ 149",
    cadence: "/mês",
    highlight: false,
    features: ["IA + exports ilimitados", "10 usuários", "Relatórios personalizados", "Automações avançadas"],
    cta: "Assinar Pro",
    action: "planos" as const,
  },
  {
    name: "Enterprise",
    price: "R$ 297",
    cadence: "/mês",
    highlight: false,
    features: ["Ilimitado tudo", "Usuários ilimitados", "SLA + suporte dedicado", "Onboarding assistido"],
    cta: "Falar com vendas",
    action: "planos" as const,
  },
];

export default function PricingSection({ onSignup }: Props) {
  const navigate = useNavigate();

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

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
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
                <span className="text-3xl font-semibold text-foreground font-mono tabular-nums">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.cadence}</span>
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
          ))}
        </div>
      </div>
    </section>
  );
}
