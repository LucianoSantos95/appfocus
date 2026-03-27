import { useState } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { usePlan } from "@/contexts/PlanContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "sonner";

const plans = [
  {
    id: "plus" as const,
    name: "Plus",
    monthlyPrice: 69,
    annualPrice: 55,
    annualTotal: 660,
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
    id: "pro" as const,
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 119,
    annualTotal: 1428,
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
    id: "enterprise" as const,
    name: "Enterprise",
    monthlyPrice: 297,
    annualPrice: 237,
    annualTotal: 2844,
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

function PlanCardSkeleton() {
  return (
    <Card className="border border-border">
      <CardHeader className="text-center pt-8 space-y-3">
        <Skeleton className="h-7 w-20 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
        <Skeleton className="h-10 w-32 mx-auto mt-4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mt-6" />
      </CardContent>
    </Card>
  );
}

export default function Planos() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { plan: currentPlan, isLoading: isPlanLoading, refreshSubscription } = usePlan();
  const { session } = useAuth();
  const navigate = useNavigate();

  // Check for success/cancel in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "true") {
    toast.success("Assinatura realizada com sucesso!");
    refreshSubscription();
    window.history.replaceState({}, "", "/planos");
  }

  const handleSubscribe = async (planId: "plus" | "pro" | "enterprise") => {
    if (!session?.access_token) {
      toast.error("Faça login para assinar.");
      navigate("/auth");
      return;
    }

    setLoadingPlan(planId);
    try {
      const interval = annual ? "annual" : "monthly";
      const priceId = STRIPE_PLANS[planId][interval].priceId;

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Erro ao criar sessão de pagamento");
      }

      window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <PageMeta title="Planos e Preços" description="Escolha o plano ideal para sua empresa. Plus, Pro ou Enterprise. A partir de R$55/mês." />
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

        {isPlanLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isCurrent = currentPlan === p.id;
              const isLoading = loadingPlan === p.id;

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
                      {annual ? (
                        <>
                          <span className="text-4xl font-bold text-foreground">
                            R${p.annualTotal.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-muted-foreground">/ano</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            equivale a R${p.annualPrice}/mês
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-foreground">R${p.monthlyPrice}</span>
                          <span className="text-muted-foreground">/mês</span>
                        </>
                      )}
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
                      disabled={isCurrent || isLoading}
                      onClick={() => handleSubscribe(p.id)}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...</>
                      ) : isCurrent ? (
                        "Plano Atual"
                      ) : (
                        "Assinar"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
