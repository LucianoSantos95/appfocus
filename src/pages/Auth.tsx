import { useState, useEffect } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

// O Hub Central não tem cadastro — o catálogo é aberto e sem login.
// Esta tela existe só para o dono entrar no /admin. A landing do Hub
// Empresarial que ficava aqui foi aposentada junto com o produto.

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { setTheme("light"); }, [setTheme]);

  const nextParam = searchParams.get("next");
  const destino =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/admin";

  const entrarComGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + destino,
      extraParams: { prompt: "select_account" },
    });
    if (error) {
      toast({ title: "Erro ao entrar com Google", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha) return;
    setIsLoading(true);
    const { error } = await signIn(email.trim(), senha);
    setIsLoading(false);
    if (error) {
      toast({ title: "Não foi possível entrar", description: error.message, variant: "destructive" });
      return;
    }
    navigate(destino);
  };

  const carregando = isLoading || googleLoading;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PageMeta
        path="/auth"
        title="Entrar"
        suffix="Hub Central"
        description="Acesso administrativo do Hub Central."
      />

      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src={logo} alt="" className="h-8 w-8 rounded-lg object-cover" width={32} height={32} />
            <span className="font-semibold text-foreground">Hub Central</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm transition-colors hover:bg-primary/10"
          >
            <span className="text-foreground">
              Procurando um template ou sistema?{" "}
              <span className="font-medium">O catálogo fica aqui</span>
            </span>
            <ArrowRight className="w-4 h-4 shrink-0 text-primary" />
          </Link>

          <h1 className="font-display text-3xl tracking-tight text-foreground">Entrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesso administrativo. O catálogo é aberto e não precisa de conta.
          </p>

          <form onSubmit={entrar} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="au-email">E-mail</Label>
              <Input id="au-email" type="email" value={email} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} placeholder="voce@focusinteligente.com.br" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="au-senha">Senha</Label>
              <Input id="au-senha" type="password" value={senha} autoComplete="current-password"
                onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={carregando || !email.trim() || !senha} className="w-full gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</> : "Entrar"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" onClick={entrarComGoogle} disabled={carregando} className="w-full gap-2">
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continuar com Google
          </Button>

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao catálogo
          </Link>
        </div>
      </main>
    </div>
  );
}
