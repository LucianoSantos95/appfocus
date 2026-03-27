import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import AuthLoginDialog from "@/components/auth/AuthLoginDialog";
import AuthSignupDialog from "@/components/auth/AuthSignupDialog";
import { Sparkles, ArrowRight, ArrowDown, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const avatarColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(!!inviteToken);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
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
      navigate("/");
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

  const loading = isLoading || googleLoading;

  return (
    <div className="min-h-screen flex flex-col gradient-dark">
      <AuthHeader />

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Badge */}
        <span className="badge-primary inline-flex items-center gap-1.5 mb-8 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          AO VIVO — Hub Empresarial
        </span>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight mb-6 text-center max-w-4xl">
          <span className="text-foreground">O sistema de gestão feito para </span>
          <br className="hidden md:block" />
          <span className="gradient-text text-glow">agências e consultorias</span>
          <br className="hidden md:block" />
          <span className="text-foreground"> que querem escalar.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl mx-auto text-center">
          Finanças · Projetos · Clientes · RH · Marketing · Atividades · Processos — tudo com IA integrada.
        </p>

        {/* Price */}
        <p className="text-base font-semibold text-primary mb-8 text-center">
          Grátis para começar. Planos a partir de R$69/mês.
        </p>

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

        {/* Ver Preços link */}
        <Link
          to="/planos"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          Ver Preços
          <ArrowDown className="w-3.5 h-3.5" />
        </Link>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex -space-x-2">
            {avatarColors.map((color, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full ${color} border-2 border-background flex items-center justify-center text-[10px] font-bold text-white`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">43 empresas</span> já utilizam
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

        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary/90">
          <Sparkles className="w-4 h-4" />
          Primeiros 100 usuários ganham acesso antecipado a recursos premium
        </div>
      </div>

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
