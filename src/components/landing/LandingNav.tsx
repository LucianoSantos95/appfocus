import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  onLogin: () => void;
  onSignup: () => void;
}

export default function LandingNav({ onLogin, onSignup }: Props) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Hub Empresarial" className="h-8 w-auto" />
          <span className="text-base font-semibold tracking-tight text-foreground">Hub Empresarial</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#por-que" className="hover:text-foreground transition-colors">Por que o Hub</a>
          <a href="#ia-mcp" className="hover:text-foreground transition-colors">IA & MCP</a>
          <a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a>
          <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onLogin} className="text-foreground">
            Entrar
          </Button>
          <Button
            size="sm"
            onClick={onSignup}
            className="group bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5"
          >
            Começar grátis
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
