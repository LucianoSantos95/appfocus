import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { usePlan } from "@/contexts/PlanContext";

const plans = [
  {
    id: "plus",
    name: "Plus",
    monthlyPrice: 119,
    annualPrice: 99,
    description: "Para pequenas empresas que precisam de gestão completa",
    features: [
      "Criar e editar dados em todos os módulos",
      "Até 5 usuários",
      "Suporte por email",
      "Guia de Uso completo",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 249,
    annualPrice: 199,
    description: "Para empresas em crescimento com necessidades avançadas",
    features: [
      "Tudo do Plus",
      "Exportar relatórios",
      "Análise de IA (Clientes)",
      "Até 10 usuários",
      "Suporte prioritário",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 497,
    annualPrice: 397,
    description: "Para grandes empresas com necessidades customizadas",
    features: [
      "Tudo do Pro",
      "Integração API/Zapier",
      "Usuários ilimitados",
      "Suporte dedicado",
      "Onboarding personalizado",
    ],
    popular: false,
  },
];

export default function Planos() {
  const [annual, setAnnual] = useState(false);
  const { plan: currentPlan } = usePlan();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Escolha o plano ideal</h1>
          <p className="text-muted-foreground text-lg mb-8">Desbloqueie todo o potencial do Hub Empresarial</p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? "text-foreground font-semibold" : "text-muted-foreground"}`}>Mensal</span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={`text-sm ${annual ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              Anual <Badge variant="secondary" className="ml-1 text-xs">-20%</Badge>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const price = annual ? p.annualPrice : p.monthlyPrice;
            const isCurrent = currentPlan === p.id;

            return (
              <Card
                key={p.id}
                className={`relative card-hover border ${
                  p.popular ? "border-primary shadow-glow" : "border-border"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-foreground gap-1">
                      <Sparkles className="w-3 h-3" /> Mais popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl">{p.name}</CardTitle>
                  <CardDescription className="mt-2">{p.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">R${price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant={p.popular ? "default" : "outline"}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Plano Atual" : "Assinar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
