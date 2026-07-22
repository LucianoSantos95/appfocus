import { useState, useEffect } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import AuthLoginDialog from "@/components/auth/AuthLoginDialog";
import AuthSignupDialog from "@/components/auth/AuthSignupDialog";

import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import SocialProofBar from "@/components/landing/SocialProofBar";
import ReplacesSection from "@/components/landing/ReplacesSection";
import ThreePillars from "@/components/landing/ThreePillars";
import AiTerminalSection from "@/components/landing/AiTerminalSection";
import McpSection from "@/components/landing/McpSection";
import ModulesGrid from "@/components/landing/ModulesGrid";
import PricingSection from "@/components/landing/PricingSection";
import FinalCta from "@/components/landing/FinalCta";
import LandingFooter from "@/components/landing/LandingFooter";

// Removido login demo compartilhado; agora usa rota /demo (sessão anônima, read-only)

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { signIn, signUp } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(!!inviteToken);
  const [demoLoading, setDemoLoading] = useState(false);

  // Force light mode on the landing (mock is claro), sem persistir preferências futuras
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  // Capture UTM params on first visit and persist for 24h
  useEffect(() => {
    const source = searchParams.get("utm_source");
    if (!source) return;
    localStorage.setItem(
      "hub_utm",
      JSON.stringify({
        utm_source: source,
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
        captured_at: Date.now(),
      })
    );
  }, [searchParams]);

  const nextParam = searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

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
      toast({ title: "Cadastro realizado!", description: "Verifique seu email para confirmar." });
      setSignupOpen(false);
    }
  };

  const handleDemoLogin = () => {
    setDemoLoading(true);
    navigate("/demo");
  };

  const loading = isLoading || googleLoading;
  const openSignup = () => setSignupOpen(true);
  const openLogin = () => setLoginOpen(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        path="/auth"
        title="Hub Empresarial · Gestão com IA para agências e PMEs"
        description="Um Hub pra substituir suas 6 ferramentas de gestão. Finanças, clientes, projetos e IA num lugar só — conectado ao Google, WhatsApp e ChatGPT."
      />

      <LandingNav onLogin={openLogin} onSignup={openSignup} />

      <main>
        <LandingHero onSignup={openSignup} onDemo={handleDemoLogin} demoLoading={demoLoading} />
        <SocialProofBar />
        <ReplacesSection />
        <ThreePillars />
        <AiTerminalSection />
        <McpSection />
        <ModulesGrid />
        <PricingSection onSignup={openSignup} />
        <FinalCta onSignup={openSignup} onDemo={handleDemoLogin} demoLoading={demoLoading} />
      </main>

      <LandingFooter />

      <AuthLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        loading={loading}
        isLoading={isLoading}
        googleLoading={googleLoading}
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onSwitchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
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
        onSwitchToLogin={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
      />
    </div>
  );
}
