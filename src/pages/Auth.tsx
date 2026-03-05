import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";
import AuthBrandingPanel from "@/components/auth/AuthBrandingPanel";
import AuthFormPanel from "@/components/auth/AuthFormPanel";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isMobile = useIsMobile();

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
    }
  };

  const loading = isLoading || googleLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Branding Panel */}
        <AuthBrandingPanel compact={isMobile} />

        {/* Form Panel */}
        <AuthFormPanel
          defaultTab={inviteToken ? "signup" : "login"}
          loading={loading}
          isLoading={isLoading}
          googleLoading={googleLoading}
          onLogin={handleLogin}
          onSignup={handleSignup}
          onGoogleLogin={handleGoogleLogin}
          toast={toast}
        />
      </div>

      <AuthFooter />
    </div>
  );
}
