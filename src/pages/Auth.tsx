import { useState, useEffect } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import AuthLoginDialog from "@/components/auth/AuthLoginDialog";
import AuthSignupDialog from "@/components/auth/AuthSignupDialog";
import WorldCupPromoStrip from "@/components/auth/WorldCupPromoStrip";

import { ArrowRight, ArrowDown, Shield, XCircle, DollarSign, FolderKanban, Users, UserCog, Megaphone, CheckSquare, Cog, GraduationCap, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DEMO_EMAIL = "demo@focusinteligente.com.br";
const DEMO_PASSWORD = "LovableDemo2026!";

const rotatingWords = ["escalar", "organizar", "automatizar", "crescer", "faturar"];

const modules = [
  { icon: DollarSign, label: "Finanças", desc: "Controle total de receitas, despesas e fluxo de caixa." },
  { icon: FolderKanban, label: "Projetos", desc: "Gerencie entregas, prazos e equipes em um só lugar." },
  { icon: Users, label: "Clientes", desc: "CRM inteligente com histórico e insights por IA." },
  { icon: UserCog, label: "RH", desc: "Colaboradores, documentos e folha simplificados." },
  { icon: Megaphone, label: "Marketing", desc: "Campanhas, conteúdos e calendário editorial." },
  { icon: CheckSquare, label: "Tarefas", desc: "To-dos, prioridades e acompanhamento de atividades." },
  { icon: Cog, label: "Processos", desc: "Mapeie e otimize os processos da sua operação." },
];

const fakeLogos = [
  { initials: "MK", color: "bg-blue-500" },
  { initials: "DS", color: "bg-emerald-500" },
  { initials: "AT", color: "bg-violet-500" },
  { initials: "NX", color: "bg-amber-500" },
  { initials: "VP", color: "bg-rose-500" },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { signIn, signUp } = useAuth();

  // Capture UTM params on first visit and persist for 24h
  useEffect(() => {
    const source = searchParams.get("utm_source");
    if (!source) return;
    localStorage.setItem("hub_utm", JSON.stringify({
      utm_source: source,
      utm_medium: searchParams.get("utm_medium"),
      utm_campaign: searchParams.get("utm_campaign"),
      captured_at: Date.now(),
    }));
  }, [searchParams]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(!!inviteToken);
  const [demoLoading, setDemoLoading] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("animate-rotate-word-in");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass("animate-rotate-word-out");
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setFadeClass("animate-rotate-word-in");
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + safeNext,
      extraParams: { prompt: "select_account" },
    });
    if (error) {
      toast({ title: "Erro ao entrar com Google", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      setLoginOpen(false);
      navigate(safeNext);
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const { error } = await signUp(email, password, name, inviteToken || undefined);
    setIsLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastro realizado!", description: "Verifique seu email para confirmar o cadastro." });
      setSignupOpen(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    const { error } = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    setDemoLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar como avaliador", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bem-vindo, avaliador!", description: "Acesso completo liberado para exploração." });
      navigate("/");
    }
  };

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(`${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
      toast({ title: "Credenciais copiadas" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const loading = isLoading || googleLoading;

  return (
    <div className="min-h-screen flex flex-col gradient-dark relative overflow-hidden">
      <PageMeta path="/auth" title="Login" description="Acesse o Hub Empresarial. Sistema de gestão integrado para agências, consultorias e pequenas empresas." />
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid principal */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Formas geométricas simulando dashboards/cards */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect x='20' y='20' width='120' height='80' rx='8' fill='none' stroke='%236EA8FE' stroke-width='1'/%3E%3Crect x='260' y='50' width='100' height='60' rx='8' fill='none' stroke='%236EA8FE' stroke-width='1'/%3E%3Crect x='40' y='250' width='140' height='90' rx='8' fill='none' stroke='%236EA8FE' stroke-width='1'/%3E%3Crect x='240' y='220' width='120' height='70' rx='8' fill='none' stroke='%236EA8FE' stroke-width='1'/%3E%3Cline x1='30' y1='140' x2='170' y2='140' stroke='%236EA8FE' stroke-width='1'/%3E%3Cline x1='30' y1='155' x2='130' y2='155' stroke='%236EA8FE' stroke-width='1'/%3E%3Cline x1='30' y1='170' x2='150' y2='170' stroke='%236EA8FE' stroke-width='1'/%3E%3Cline x1='250' y1='160' x2='370' y2='160' stroke='%236EA8FE' stroke-width='1'/%3E%3Cline x1='250' y1='175' x2='340' y2='175' stroke='%236EA8FE' stroke-width='1'/%3E%3Ccircle cx='300' cy='350' r='25' fill='none' stroke='%236EA8FE' stroke-width='1'/%3E%3Crect x='60' y='370' width='80' height='10' rx='4' fill='%236EA8FE' opacity='0.3'/%3E%3C/svg%3E")`,
        }} />
        {/* Blur blobs mais intensos */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <WorldCupPromoStrip onCadastrar={() => setSignupOpen(true)} />
      <AuthHeader />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">

        {/* Headline with rotating word */}
        <h1 className="text-4xl md:text-6xl xl:text-7xl font-extrabold leading-tight mb-4 text-center max-w-4xl">
          <span className="text-foreground">Gestão inteligente para</span>
          <br />
          <span key={wordIndex} className={`gradient-text text-glow inline-block ${fadeClass}`}>
            {rotatingWords[wordIndex]}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-md mx-auto text-center">
          Tudo que sua agência precisa em um só lugar.
        </p>

        {/* 7 Module icons with tooltips */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
            {modules.map((mod) => (
              <Tooltip key={mod.label}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-secondary/50 cursor-default hover:border-primary/40 hover:bg-primary/10 transition-all duration-200">
                    <mod.icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">{mod.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px] text-center">
                  <p className="text-xs">{mod.desc}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Button
            className="btn-hero text-foreground font-semibold h-12 px-8 text-base"
            onClick={() => setSignupOpen(true)}
          >
            Cadastrar
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            className="h-12 px-8 text-base font-semibold"
            onClick={() => setLoginOpen(true)}
          >
            Entrar
          </Button>
        </div>

        {/* Demo login card — Lovable Partner reviewers */}
        <div className="w-full max-w-md mb-8 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-5 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Avaliador Lovable Partner</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Acesso completo ao Hub com dados pré-carregados para avaliação da certificação.
          </p>
          <div className="space-y-2 mb-4 text-xs font-mono bg-background/60 rounded-lg p-3 border border-border/50">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Email:</span>
              <span className="text-foreground">{DEMO_EMAIL}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Senha:</span>
              <span className="text-foreground">{DEMO_PASSWORD}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 gradient-primary text-foreground font-semibold"
              onClick={handleDemoLogin}
              disabled={demoLoading}
            >
              {demoLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Entrar como avaliador
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={copyCredentials}
              title="Copiar credenciais"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Ver Preços link */}
        <Link
          to="/planos"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          Ver Preços
          <ArrowDown className="w-3.5 h-3.5" />
        </Link>

        {/* Social proof with fake logos */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex -space-x-2">
            {fakeLogos.map((logo, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${logo.color} border-2 border-background flex items-center justify-center text-[9px] font-black text-white tracking-tight`}
              >
                {logo.initials}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">+100 usuários</span> já utilizam
          </span>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Sem cartão de crédito
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <XCircle className="w-3.5 h-3.5 text-primary" />
            Cancele quando quiser
          </span>
        </div>

      </main>

      <AuthFooter />

      {/* Dialogs */}
      <AuthLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        loading={loading}
        isLoading={isLoading}
        googleLoading={googleLoading}
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onSwitchToSignup={() => { setLoginOpen(false); setSignupOpen(true); }}
      />
      <AuthSignupDialog
        open={signupOpen}
        onOpenChange={setSignupOpen}
        loading={loading}
        isLoading={isLoading}
        googleLoading={googleLoading}
        onSignup={handleSignup}
        onGoogleLogin={handleGoogleLogin}
        toast={toast}
        onSwitchToLogin={() => { setSignupOpen(false); setLoginOpen(true); }}
      />
    </div>
  );
}