import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Lock, Mail, User, ArrowRight } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  isLoading: boolean;
  googleLoading: boolean;
  onSignup: (name: string, email: string, password: string) => void;
  onGoogleLogin: () => void;
  toast: (opts: { title: string; description: string; variant?: "destructive" }) => void;
  onSwitchToLogin: () => void;
}

export default function AuthSignupDialog({ open, onOpenChange, loading, isLoading, googleLoading, onSignup, onGoogleLogin, toast, onSwitchToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    if (!acceptedTerms) {
      toast({ title: "Termos obrigatórios", description: "Aceite os Termos de Uso para continuar.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", description: "Verifique se as senhas são iguais.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    onSignup(name, email, password);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Criar conta grátis</DialogTitle>
          <DialogDescription>Teste grátis por 30 dias. Sem cartão de crédito.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="signup-name" type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="signup-confirm" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" disabled={loading} />
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
              Li e aceito os{" "}
              <Link to="/termos" className="text-primary hover:underline" target="_blank">Termos de Uso</Link>
              {" "}e a{" "}
              <Link to="/privacidade" className="text-primary hover:underline" target="_blank">Política de Privacidade</Link>
            </label>
          </div>
          <Button type="submit" className="w-full btn-hero text-foreground font-semibold h-12 text-base" disabled={loading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Testar Grátis por 30 dias
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou</span></div>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={onGoogleLogin} disabled={loading}>
            {googleLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            <GoogleIcon />
            Cadastrar com Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline font-medium">
              Entrar
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
