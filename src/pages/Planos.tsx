import { useState, useEffect } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Sparkles, ArrowLeft, Loader2, Gift } from "lucide-react";
import { usePlan } from "@/contexts/PlanContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useMilestones } from "@/hooks/useMilestones";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS } from "@/lib/stripe-plans";
import { toast } from "sonner";
import { getActiveCampaignCoupon, isWorldCupActive } from "@/lib/campaigns";

const plans = [
  {
    id: "plus" as const,
    name: "Plus",
    monthlyPrice: 69,
    annualPrice: 55,
    annualTotal: 660,
    description: "Para agências e consultorias que precisam de gestão completa",
    features: [
      "Criar e editar dados em todos os módulos",
      "Até 5 usuários por conta",
      "Importação de planilhas (Excel/CSV/OFX)",
      "Guia de Uso completo",
      "Suporte por email",
    ],
    popular: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 119,
    annualTotal: 1428,
    description: "Para operações em crescimento com necessidades avançadas",
    features: [
      "Tudo do Plus",
      "Exportar relatórios (PDF/Excel)",
      "Análise de IA para Clientes",
      "Assistente de IA integrado",
      "Até 10 usuários por conta",
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
    description: "Para agências com múltiplos times e clientes",
    features: [
      "Tudo do Pro",
      "Integração Google Workspace",
      "Automação WhatsApp (lembretes)",
      "Usuários ilimitados",
      "Suporte dedicado + onboarding",
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
  const [annual, setAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { plan: currentPlan, isLoading: isPlanLoading, refreshSubscription } = usePlan();
  const { session: authSession } = useAuth();
  const { session: onbSession } = useOnboardingSession();
  const { recordMilestone } = useMilestones();
  const navigate = useNavigate();

  // Determine if user has an active coupon from onboarding
  const hasCoupon = onbSession?.coupon_code &&
    onbSession?.coupon_expires_at &&
    new Date(onbSession.coupon_expires_at).getTime() > Date.now();

  // Campaign coupon from URL (?coupon=XXXX) — overrides onboarding coupon
  const urlCoupon = new URLSearchParams(window.location.search).get("coupon");

  useEffect(() => {
    // Handle Stripe success redirect (?success=true) — must run once on mount,
    // not on every render, to avoid duplicate toasts and milestone records.
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso!");
      void recordMilestone("upgrade_completed", { source: "plan_page" });
      refreshSubscription();
      window.history.replaceState({}, "", "/planos");
    }
    void recordMilestone("plan_page_viewed", { from: window.location.pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubscribe = async (planId: "plus" | "pro" | "enterprise") => {
    // Refresh session so the token sent to the edge function is always valid
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    const accessToken = freshSession?.access_token ?? authSession?.access_token;

    if (!accessToken) {
      toast.error("Faça login para assinar.");
      navigate("/auth");
      return;
    }

    setLoadingPlan(planId);
    try {
      await recordMilestone("checkout_started", {
        plan: planId,
        billing_cycle: annual ? "annual" : "monthly",
        has_coupon: Boolean(hasCoupon),
      });

      const interval = annual ? "annual" : "monthly";
      const priceId = STRIPE_PLANS[planId][interval].priceId;

      const body: any = { priceId };
      // Priority: URL coupon (campaign) > onboarding coupon
      if (urlCoupon) {
        body.couponId = urlCoupon;
      } else if (hasCoupon) {
        body.couponId = getActiveCampaignCoupon().stripeId;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Edge function may return { error } in the body even on non-2xx
      const serverMsg = (data as any)?.error;
      if (serverMsg) throw new Error(serverMsg);

      if (error) {
        // Try to extract a readable message from the FunctionsHttpError response
        let detail = "";
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.json === "function") {
            const j = await ctx.json();
            detail = j?.error || "";
          } else if (ctx && typeof ctx.text === "function") {
            detail = await ctx.text();
          }
        } catch { /* ignore */ }
        throw new Error(detail || error.message || "Erro ao criar sessão de pagamento");
      }

      if (!data?.url) throw new Error("Resposta inválida do servidor de pagamento.");

      // Same-tab redirect to avoid popup blockers after awaits
      window.location.href = data.url;
    } catch (err: any) {
      console.error("[create-checkout]", err);
      toast.error(err.message || "Erro ao iniciar checkout");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <PageMeta path="/planos" title="Planos e Preços" description="Escolha o plano ideal para sua agência ou consultoria. Plus, Pro ou Enterprise. A partir de R$55/mês." />
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Escolha o plano ideal</h1>
          <p className="text-muted-foreground text-lg mb-8">Desbloqueie todo o potencial da sua operação</p>

          {/* Coupon banner */}
          {hasCoupon && (
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-5 py-2.5 mb-6 animate-fade-in">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {isWorldCupActive()
                  ? "🏆 Cupom HEXA — 20% OFF nos 3 primeiros meses aplicado automaticamente!"
                  : "🎉 Cupom de 20% OFF aplicado automaticamente!"}
              </span>
            </div>
          )}

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

              // Calculate discounted prices
              const displayMonthly = hasCoupon ? Math.round(p.monthlyPrice * 0.8) : p.monthlyPrice;
              const displayAnnualTotal = hasCoupon ? Math.round(p.annualTotal * 0.8) : p.annualTotal;
              const displayAnnualPrice = hasCoupon ? Math.round(p.annualPrice * 0.8) : p.annualPrice;

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
                          {hasCoupon && (
                            <span className="text-lg text-muted-foreground line-through mr-2">
                              R${p.annualTotal.toLocaleString("pt-BR")}
                            </span>
                          )}
                          <span className="text-4xl font-bold text-foreground">
                            R${displayAnnualTotal.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-muted-foreground">/ano</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            equivale a R${displayAnnualPrice}/mês
                          </p>
                        </>
                      ) : (
                        <>
                          {hasCoupon && (
                            <span className="text-lg text-muted-foreground line-through mr-2">
                              R${p.monthlyPrice}
                            </span>
                          )}
                          <span className="text-4xl font-bold text-foreground">R${displayMonthly}</span>
                          <span className="text-muted-foreground">/mês</span>
                          {hasCoupon && (
                            <p className="text-xs text-primary mt-1">
                              {isWorldCupActive() ? "20% OFF nos 3 primeiros meses" : "Primeiro mês com 20% OFF"}
                            </p>
                          )}
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
                      ) : hasCoupon ? (
                        <><Gift className="w-4 h-4 mr-1" /> Assinar com 20% OFF</>
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
